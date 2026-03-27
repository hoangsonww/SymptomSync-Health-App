"""Benchmark: api response performance."""
import time

def bench_api_response():
    start = time.perf_counter()
    # TODO: implement api response benchmark
    elapsed = time.perf_counter() - start
    print(f"api response: {elapsed:.4f}s")

if __name__ == "__main__":
    bench_api_response()
