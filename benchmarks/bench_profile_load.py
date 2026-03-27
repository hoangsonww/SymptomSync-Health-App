"""Benchmark: profile load performance."""
import time

def bench_profile_load():
    start = time.perf_counter()
    # TODO: implement profile load benchmark
    elapsed = time.perf_counter() - start
    print(f"profile load: {elapsed:.4f}s")

if __name__ == "__main__":
    bench_profile_load()
