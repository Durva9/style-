import time
import requests
import statistics

BASE_URL = "http://localhost:5001"

# Use a real image URL from your wardrobe (paste one from MongoDB)
TEST_IMAGE_URL = "https://res.cloudinary.com/hb85nhr5/image/upload/v1783679431/nrqhr3xldmfsdljyle6h.jpg"

def benchmark_endpoint(endpoint, payload, n_runs=10):
    times = []
    for i in range(n_runs):
        start = time.time()
        try:
            response = requests.post(f"{BASE_URL}{endpoint}", json=payload, timeout=60)
            elapsed_ms = (time.time() - start) * 1000
            if response.status_code == 200:
                times.append(elapsed_ms)
            else:
                print(f"  Run {i+1}: FAILED (status {response.status_code})")
        except Exception as e:
            print(f"  Run {i+1}: ERROR - {e}")

    if times:
        return {
            "endpoint": endpoint,
            "runs": len(times),
            "avg_ms": round(statistics.mean(times), 1),
            "min_ms": round(min(times), 1),
            "max_ms": round(max(times), 1),
            "median_ms": round(statistics.median(times), 1),
        }
    return {"endpoint": endpoint, "error": "all runs failed"}

print("Benchmarking /classify ...")
classify_result = benchmark_endpoint("/classify", {"imageUrl": TEST_IMAGE_URL})

print("Benchmarking /analyze-color ...")
color_result = benchmark_endpoint("/analyze-color", {"imageUrl": TEST_IMAGE_URL})

print("\n" + "=" * 60)
print("LATENCY BENCHMARK RESULTS (milliseconds)")
print("=" * 60)
for r in [classify_result, color_result]:
    print(r)