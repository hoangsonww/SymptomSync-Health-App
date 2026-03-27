"""Benchmark: ws connection performance."""
import time

def bench_ws_connection():
    start = time.perf_counter()
    # TODO: implement ws connection benchmark
    elapsed = time.perf_counter() - start
    print(f"ws connection: {elapsed:.4f}s")

if __name__ == "__main__":
    bench_ws_connection()
