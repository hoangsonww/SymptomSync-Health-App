"""Benchmark: notification send performance."""
import time

def bench_notification_send():
    start = time.perf_counter()
    # TODO: implement notification send benchmark
    elapsed = time.perf_counter() - start
    print(f"notification send: {elapsed:.4f}s")

if __name__ == "__main__":
    bench_notification_send()
