
from pathlib import Path
import subprocess
import tempfile

ROOT = Path("/home/krr/Projects/ARES-MISSION-CONTROL/videos_and_powerpoints")
OUTPUT = ROOT / "ARES_Mission_Control_COMPLETE.mp4"

items = [
    ("pptx", ROOT / "ARES_Mission_Control_NASA_Space_Apps_2026_TR.pptx"),
    ("video", ROOT / "ares-mission-control-tr.mp4"),
    ("pptx", ROOT / "ARES_Mission_Control_NASA_Space_Apps_2026.pptx"),
    ("video", ROOT / "ares-mission-control-en.mp4"),
]

def run(*args):
    subprocess.run(args, check=True)

with tempfile.TemporaryDirectory() as temp:
    work = Path(temp)
    segments = []

    def encode(source, target, is_image=False):
        args = ["ffmpeg", "-y"]
        if is_image:
            args += ["-loop", "1", "-framerate", "30", "-t", "5"]
        args += ["-i", str(source)]
        args += [
            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
            "-map", "0:v:0", "-map", "0:a:0?",
        ]
        # Use silent audio only when the source has no audio.
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "a",
             "-show_entries", "stream=index", "-of", "csv=p=0",
             str(source)],
            capture_output=True, text=True, check=True
        )
        if not probe.stdout.strip():
            args[-1] = "1:a:0"

        args += [
            "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,"
                   "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,"
                   "setsar=1,fps=30",
            "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-ar", "48000", "-ac", "2",
            "-shortest", "-movflags", "+faststart",
            str(target)
        ]
        run(*args)

    for kind, source in items:
        if not source.exists():
            raise FileNotFoundError(source)

        if kind == "pptx":
            folder = work / f"slides_{len(segments)}"
            folder.mkdir()
            run(
                "libreoffice", "-env:UserInstallation=file://" + str(folder / "profile"),
                "--headless", "--convert-to", "pdf",
                "--outdir", str(folder), str(source)
            )
            pdf = folder / (source.stem + ".pdf")
            run("pdftoppm", "-png", "-r", "120", str(pdf),
                str(folder / "slide"))

            for slide in sorted(folder.glob("slide-*.png")):
                segment = work / f"part_{len(segments):04d}.mp4"
                encode(slide, segment, is_image=True)
                segments.append(segment)
        else:
            segment = work / f"part_{len(segments):04d}.mp4"
            encode(source, segment)
            segments.append(segment)

    playlist = work / "playlist.txt"
    playlist.write_text(
        "".join(f"file '{p}'\n" for p in segments)
    )

    run(
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(playlist), "-c", "copy", str(OUTPUT)
    )

print(f"Created: {OUTPUT}")
