from datetime import datetime

def create_violation_entry(peer_id, reasons):
    return {
        "peer_id": peer_id,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "reasons": reasons
    }
