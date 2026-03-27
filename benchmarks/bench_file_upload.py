"""Benchmark: file upload performance."""
import time

def bench_file_upload():
    start = time.perf_counter()
    # TODO: implement file upload benchmark
    elapsed = time.perf_counter() - start
    print(f"file upload: {elapsed:.4f}s")

if __name__ == "__main__":
    bench_file_upload()
