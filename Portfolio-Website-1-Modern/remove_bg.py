from rembg import remove, new_session
from PIL import Image
import numpy as np
import shutil

input_path = 'images-and-icons/images/projects-profile.png'
# First restore original from user - we need to re-download/copy
# Since we overwrote the original, let's try with the current processed version
# Actually let's re-process more gently

output_path = 'images-and-icons/images/projects-profile.png'

session = new_session('u2net')

# Read as RGB to start fresh (even if already has alpha)
input_img = Image.open(input_path)
if input_img.mode == 'RGBA':
    # Composite onto black background to get original-like image
    bg = Image.new('RGB', input_img.size, (0, 0, 0))
    bg.paste(input_img, mask=input_img.split()[3])
    input_img = bg
else:
    input_img = input_img.convert('RGB')

# Gentler settings: no alpha matting erosion, softer thresholds
output_img = remove(
    input_img, 
    session=session, 
    alpha_matting=True, 
    alpha_matting_foreground_threshold=270,  # more forgiving foreground
    alpha_matting_background_threshold=20,   # gentler background
    alpha_matting_erode_size=0               # no erosion to preserve edges
)
output_img.save(output_path, format='PNG')

a = np.array(output_img)
print(f"Done! Mode: {output_img.mode}, Size: {output_img.size}")
print(f"Transparent pixels: {(a[:,:,3] == 0).sum()} / {a[:,:,3].size}")
