import psutil
import os
import signal

def kill_port_8000():
    killed_count = 0
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            for conn in proc.info.get('connections') or []:
                if conn.laddr.port == 8000:
                    print(f"Killing PID {proc.info['pid']} ({proc.info['name']}) on port 8000...")
                    os.kill(proc.info['pid'], signal.SIGTERM)
                    killed_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    if killed_count == 0:
        print("No process found on port 8000.")
    else:
        print(f"Killed {killed_count} processes.")

if __name__ == "__main__":
    try:
        kill_port_8000()
    except Exception as e:
        print(f"Error: {e}")
        # Fallback to netstat/taskkill if psutil fails/not installed
        import subprocess
        print("Attempting fallback using netstat...")
        try:
            output = subprocess.check_output("netstat -ano | findstr :8000", shell=True).decode()
            for line in output.splitlines():
                parts = line.strip().split()
                if len(parts) > 4:
                    pid = parts[-1]
                    print(f"Taskkill PID {pid}")
                    subprocess.call(f"taskkill /F /PID {pid}", shell=True)
        except:
            print("Fallback failed.")
