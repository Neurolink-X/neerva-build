"""Free offline Cycles render of a Neerva-exported GLB; never invent house geometry.
Usage: blender -b -t 4 --python scripts/studio/render_scene.py -- scene.glb output.png
Optional: --samples 64 --width 1280 --height 960 --evening
Requires Blender installed separately. No production server or external texture service.
"""
import argparse
import sys
from pathlib import Path
import math
import bpy

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument("scene")
parser.add_argument("output")
parser.add_argument("--samples", type=int, default=64)
parser.add_argument("--width", type=int, default=1280)
parser.add_argument("--height", type=int, default=960)
parser.add_argument("--evening", action="store_true")
cfg = parser.parse_args(args)
if not 8 <= cfg.samples <= 256 or not 320 <= cfg.width <= 3840 or not 320 <= cfg.height <= 2160:
    parser.error("Samples or output dimensions outside bounded render settings.")
source = Path(cfg.scene).resolve()
output = Path(cfg.output).resolve()
if not source.is_file() or source.suffix.lower() != ".glb" or output.suffix.lower() != ".png":
    parser.error("Provide an existing GLB and a PNG output path.")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
scene = bpy.context.scene
cameras = [o for o in scene.objects if o.type == "CAMERA"]
camera = next((o for o in cameras if o.name.startswith("NeervaRenderCamera")), None)
if camera is None:
    raise RuntimeError("Export camera missing; export the selected view again from Neerva.")
if not any(o.type == "MESH" for o in scene.objects):
    raise RuntimeError("No architecture geometry in export.")
scene.camera = camera
world = bpy.data.worlds.new("Procedural architectural sky")
world.use_nodes = True
scene.world = world
nodes = world.node_tree.nodes
background = nodes.get("Background")
sky = nodes.new("ShaderNodeTexSky")
sky.sky_type = "NISHITA"
sky.sun_elevation = math.radians(12 if cfg.evening else 48)
sky.sun_rotation = math.radians(125)
sky.sun_disc = True
world.node_tree.links.new(sky.outputs["Color"], background.inputs["Color"])
background.inputs["Strength"].default_value = .25 if cfg.evening else .4
# Physical environment lighting only: never add or move walls, rooms, doors or gates.
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = cfg.samples
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = True
scene.render.resolution_x = cfg.width
scene.render.resolution_y = cfg.height
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(output)
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.render.render(write_still=True)
if not output.is_file():
    raise RuntimeError("Render did not produce the requested image.")
print("Rendered exact exported concept geometry:", output)
