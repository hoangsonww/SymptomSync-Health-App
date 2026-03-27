"""Benchmark: search index performance."""
import time

def bench_search_index():
    start = time.perf_counter()
    # TODO: implement search index benchmark
    elapsed = time.perf_counter() - start
    print(f"search index: {elapsed:.4f}s")

if __name__ == "__main__":
    bench_search_index()
