"""Benchmark: auth flow performance."""
import time

def bench_auth_flow():
    start = time.perf_counter()
    # TODO: implement auth flow benchmark
    elapsed = time.perf_counter() - start
    print(f"auth flow: {elapsed:.4f}s")

if __name__ == "__main__":
    bench_auth_flow()
