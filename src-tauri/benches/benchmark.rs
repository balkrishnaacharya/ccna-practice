use ccna_practice_lib::{commands, db};
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use rand::rngs::StdRng;
use rand::SeedableRng;
use rusqlite::{params, Connection};
use std::collections::HashMap;
use tempfile::tempdir;

fn bench_conn() -> (Connection, tempfile::TempDir) {
    let dir = tempdir().unwrap();
    let path = dir.path().join("bench.db");
    let conn = db::init(path.as_path()).unwrap();
    // foreign_keys is on; seed a parent question so SM-2 writes have a row to reference.
    conn.execute(
        "INSERT INTO questions (id, stem, domain, difficulty, multi_select, content_hash)
         VALUES (?1, ?2, ?3, ?4, ?5, NULL)",
        params![1, "bench question", "network_infra", "easy", 0],
    )
    .unwrap();
    (conn, dir)
}

fn bench_weighted_exam_sample(c: &mut Criterion) {
    let candidates: Vec<commands::ExamCandidate> = (0..200)
        .map(|i| commands::ExamCandidate {
            id: i,
            stem: format!("s{i}"),
            domain: "d".into(),
            difficulty: "medium".into(),
            multi_select: 0,
            subtopic: format!("t{}", i % 10),
            adaptive_weight: 1.0,
        })
        .collect();
    c.bench_function("weighted_exam_sample 100", |b| {
        b.iter(|| {
            let mut cands = candidates.clone();
            let mut counts = HashMap::new();
            let _ = commands::weighted_exam_sample(
                black_box(&mut cands),
                100,
                black_box(&mut StdRng::seed_from_u64(42)),
                black_box(&mut counts),
            );
        })
    });
}

fn bench_sm2_calculation(c: &mut Criterion) {
    let (conn, _dir) = bench_conn();
    c.bench_function("sm2_update", |b| {
        b.iter(|| {
            let _ = commands::record_question_stat(
                black_box(&conn),
                black_box(1),
                black_box(true),
                black_box(1_700_000_000),
            );
        })
    });
}

fn bench_get_exam_questions(c: &mut Criterion) {
    let dir = tempdir().unwrap();
    let path = dir.path().join("bench_exam.db");
    let conn = db::init(path.as_path()).unwrap();
    // Seed one question per subtopic so the two-per-topic cap does not bind,
    // with enough rows to reach the 100-question blueprint.
    let targets = [
        ("network_infra", 25usize),
        ("switching", 25usize),
        ("ip_routing", 20usize),
        ("services_security", 20usize),
        ("ai_ops", 10usize),
    ];
    let mut id = 1i64;
    for (domain, count) in targets {
        for j in 0..count {
            conn.execute(
                "INSERT INTO questions (id, stem, domain, difficulty, multi_select, subtopic, content_hash)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL)",
                params![id, format!("q {id}"), domain, "medium", 0, format!("sub-{domain}-{j}")],
            )
            .unwrap();
            conn.execute(
                "INSERT INTO choices (id, question_id, text, is_correct, sort_order)
                 VALUES (?1, ?2, ?3, ?4, 1)",
                params![id * 10 + 1, id, "correct", 1],
            )
            .unwrap();
            conn.execute(
                "INSERT INTO choices (id, question_id, text, is_correct, sort_order)
                 VALUES (?1, ?2, ?3, ?4, 1)",
                params![id * 10 + 2, id, "wrong", 0],
            )
            .unwrap();
            id += 1;
        }
    }
    std::mem::forget(dir); // keep the db file alive for the bench run

    c.bench_function("get_exam_questions", |b| {
        b.iter(|| {
            let _ = commands::get_exam_questions_conn(black_box(&conn)).unwrap();
        })
    });
}

criterion_group!(
    benches,
    bench_weighted_exam_sample,
    bench_sm2_calculation,
    bench_get_exam_questions
);
criterion_main!(benches);
