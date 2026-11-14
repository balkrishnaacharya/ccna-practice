# Rust Testing Improvements Plan

## Current State Analysis

**What exists:**
- Unit tests in `commands.rs` (truncated output, appears incomplete)
- No integration tests (`tests/` directory missing)
- No test dependencies in `Cargo.toml`
- No benchmarking setup
- No coverage tooling configured

**What's missing per rust-testing skill:**
- ✅ TDD workflow not followed (tests appear written after implementation)
- ❌ Property-based testing (proptest)
- ❌ Parameterized tests (rstest)
- ❌ Mocking (mockall)
- ❌ Integration tests
- ❌ Benchmarks (criterion)
- ❌ Coverage reporting (cargo-llvm-cov)

---

## Improvement Plan

### Phase 1: Test Infrastructure Setup

**1.1 Add test dependencies to Cargo.toml**
```toml
[dev-dependencies]
# Unit test helpers
rstest = "0.18"
mockall = { version = "0.12", features = ["nightly"] }

# Property-based testing
proptest = "1.4"

# Benchmarking
criterion = { version = "0.5", features = ["html_reports"] }

# Test utilities
tempfile = "3.8"
serial_test = "3.0"  # For tests needing sequential execution
```

**1.2 Add benchmark target**
```toml
[[bench]]
name = "benchmark"
harness = false
```

**1.3 Install coverage tool**
```bash
cargo install cargo-llvm-cov
```

---

### Phase 2: Unit Test Improvements

**2.1 Complete existing tests in `commands.rs`**
- Verify all `#[cfg(test)]` modules compile and pass
- Add tests for uncovered functions:
  - `weighted_exam_sample`
  - `drill_question_conn`
  - `record_question_stat` (SM-2 algorithm)
  - `streak_stats_conn`
  - `daily_activity`, `daily_goal`, `date_label`
  - `get_random_question_conn` (all modes: easy/medium/hard/impossible/exam/weak/review)

**2.2 Add parameterized tests with `rstest`**
```rust
#[rstest]
#[case("easy", "easy")]
#[case("medium", "medium")]
#[case("hard", "hard")]
#[case("impossible", "hard")]
fn test_difficulty_mapping(#[case] mode: &str, #[case] expected: &str) { ... }

#[rstest]
#[case(4, 2.5, 0, 0, true, 1, 1, 2.6)]   // q=4, reps=0
#[case(4, 2.5, 1, 1, true, 2, 6, 2.6)]   // q=4, reps=1
#[case(4, 2.5, 2, 6, true, 3, 15, 2.6)]  // q=4, reps=2
fn test_sm2_correct(#[case] q: i64, #[case] ef: f64, #[case] reps: i64, #[case] interval: i64, #[case] correct: bool, ...) { ... }
```

**2.3 Add property-based tests with `proptest`**
```rust
proptest! {
    #[test]
    fn sm2_ease_factor_bounded(q in 0..6, ef in 1.3..3.0, reps in 0..100, interval in 0..365) {
        let new_ef = calculate_ef(ef, q);
        assert!(new_ef >= 1.3);
    }

    #[test]
    fn streak_calculation_no_panic(days in prop::collection::vec(0..365, 0..100)) { ... }
}
```

**2.4 Add mocking for database-dependent functions**
```rust
#[automock]
trait QuestionRepo {
    fn get_random(&self, mode: &str) -> Option<Question>;
    fn get_stats(&self) -> Stats;
}

#[test]
fn submit_answer_calls_repo() {
    let mut mock = MockQuestionRepo::new();
    mock.expect_get_random().returning(|| Some(question()));
    // test service logic
}
```

---

### Phase 3: Integration Tests

**3.1 Create `tests/` directory structure**
```
tests/
├── common/
│   └── mod.rs          # Shared test utilities (test DB setup, fixtures)
├── db_test.rs          # Database migration & schema tests
├── commands_test.rs    # Tauri command integration tests
├── sm2_test.rs         # Spaced repetition integration tests
├── exam_test.rs        # Exam generation & scoring tests
└── streak_test.rs      # Streak calculation integration tests
```

**3.2 Example integration test**
```rust
// tests/commands_test.rs
use ccna_practice_lib::{commands::*, db};

#[test]
fn full_submit_answer_flow() {
    let conn = db::init(&tempfile::tempdir().unwrap().path().join("test.db")).unwrap();
    let db = Db(Mutex::new(conn));
    
    // Insert test question + choices
    insert_test_question(&db, 1, "What is...", "network_infra", "easy");
    insert_test_choice(&db, 1, 1, "Answer A", true);
    insert_test_choice(&db, 2, 1, "Answer B", false);
    
    // Submit correct answer
    let result = submit_answer_conn(&SubmitPayload { question_id: 1, choice_ids: vec![1] }, &db.0.lock().unwrap());
    assert!(result.is_ok());
    assert!(result.unwrap().correct);
    
    // Verify stats updated
    let stats = get_stats(State::new(db.clone())).unwrap();
    assert_eq!(stats.answered, 1);
    assert_eq!(stats.correct, 1);
}
```

---

### Phase 4: Benchmarks

**4.1 Create `benches/benchmark.rs`**
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use ccna_practice_lib::commands::*;

fn bench_weighted_exam_sample(c: &mut Criterion) {
    let mut candidates = generate_candidates(1000);
    let mut topic_counts = HashMap::new();
    c.bench_function("weighted_exam_sample 100", |b| {
        b.iter(|| weighted_exam_sample(black_box(&mut candidates), 100, &mut rand::thread_rng(), black_box(&mut topic_counts)))
    });
}

fn bench_sm2_calculation(c: &mut Criterion) {
    c.bench_function("SM-2 update", |b| {
        b.iter(|| record_question_stat(black_box(&conn), 1, true, now_secs()))
    });
}

fn bench_get_exam_questions(c: &mut Criterion) {
    c.bench_function("get_exam_questions", |b| {
        b.iter(|| get_exam_questions_conn(black_box(&conn)))
    });
}

criterion_group!(benches, bench_weighted_exam_sample, bench_sm2_calculation, bench_get_exam_questions);
criterion_main!(benches);
```

---

### Phase 5: CI/CD Integration

**5.1 GitHub Actions workflow**
```yaml
# .github/workflows/test.yml
name: Test & Coverage
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt
      - name: Check formatting
        run: cargo fmt --check
      - name: Clippy
        run: cargo clippy -- -D warnings
      - name: Unit tests
        run: cargo test --lib
      - name: Integration tests
        run: cargo test --tests
      - name: Doc tests
        run: cargo test --doc

  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: taiki-e/install-action@cargo-llvm-cov
      - name: Coverage
        run: cargo llvm-cov --fail-under-lines 80 --fail-under-branches 70
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./lcov.info
```

---

### Phase 6: Frontend Testing (Out of Scope for Rust)

*Note: Frontend uses React + Vite. Consider adding:*
- Vitest for unit tests
- Playwright for E2E tests (per e2e-testing skill)

---

## Validation Criteria

| Phase | Validation Command | Success Criteria |
|-------|-------------------|------------------|
| 1 | `cargo test --lib` | All new deps compile |
| 2 | `cargo test --lib` | 80%+ unit test coverage on commands.rs |
| 3 | `cargo test --tests` | All integration tests pass |
| 4 | `cargo bench` | Benchmarks run without error |
| 5 | `cargo llvm-cov` | Line coverage ≥ 80%, Branch ≥ 70% |
| CI | GitHub Actions | All workflows pass |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Database tests slow | Use `tempfile` + in-memory SQLite; `serial_test` for isolation |
| Randomness in exam selection | Seed RNG in tests; use `proptest` for property validation |
| SM-2 algorithm complexity | Test edge cases exhaustively with parameterized tests |
| Tauri context in tests | Extract pure functions (already done: `*_conn` variants) |

---

## Out of Scope

- Frontend testing (React/Vite)
- Android-specific testing
- Load/stress testing
- Visual regression testing

---

## Next Steps

1. **Approve this plan** → I'll create implementation tasks
2. **Start Phase 1** → Add deps, verify build
3. **Iterate through phases** with verification at each step