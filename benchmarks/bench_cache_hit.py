"""Benchmark: cache hit performance."""
import time

def bench_cache_hit():
    start = time.perf_counter()
    # TODO: implement cache hit benchmark
    elapsed = time.perf_counter() - start
    print(f"cache hit: {elapsed:.4f}s")

if __name__ == "__main__":
    bench_cache_hit()
