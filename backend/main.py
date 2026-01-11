import modal
import os
import uuid
import base64
from pydantic import BaseModel
import requests

app = modal.App("ai-music-gen")

image = (
    modal.Image.debian_slim()
    .apt_install("git", "ffmpeg", "libsndfile1")
    .pip_install_from_requirements("requirements.txt")
    .pip_install("soundfile", "torchaudio==2.5.1")
    .run_commands(["git clone https://github.com/ace-step/ACE-Step.git /tmp/ACE-Step", "cd /tmp/ACE-Step && pip install .",])
    .env({"HF_HOME": "/.cache/huggingface"})
    .add_local_python_source("prompts")
)

model_volume = modal.Volume.from_name("ace-step-model", create_if_missing=True)
hf_volume = modal.Volume.from_name("qwen-hf-cache", create_if_missing=True)

music_gen_secrets = modal.Secret.from_name("music-gen-secret")

# Default music generation configuration
DEFAULT_MUSIC_PROMPT = (
    "Global pop, Latin pop, tropical pop, romantic, smooth summer vibe, "
    "warm guitar, soft percussion, melodic vocals, emotional, radio hit"
)

DEFAULT_LYRICS = """[intro]
Mm… yeah
Slow lights, summer air

[verse]
We don't need words tonight,
Your eyes say more in silence,
Barefoot dancing in the dark,
Every step feels weightless.

City breathing, warm and low,
Moonlight on your shoulder,
Time moves slow when you're this close,
I just wanna hold ya.

[pre-chorus]
When you lean a little nearer,
Every doubt disappears,
Heartbeat sync, getting clearer,
This moment's all we hear.

[chorus]
Move slow, don't let go,
Feel the rhythm in your skin,
Every touch, every glow,
Pulls me deeper, pulls me in.

Say it soft, say it low,
Like a secret in my ear,
If tonight is all we own,
Let it last forever here.

[verse]
Ocean humming through the night,
Salt and neon colors,
Laughing like the world is light,
Nothing else can touch us.

Your shadow dancing next to mine,
Fire under water,
If this ends at sunrise time,
I'd still go a little farther.

[pre-chorus]
Every breath feels like a promise,
Every look feels true,
If the stars fall out of focus,
I still see you.

[chorus]
Move slow, don't let go,
Feel the rhythm in your skin,
Every touch, every glow,
Pulls me deeper, pulls me in.

Say it soft, say it low,
Like a secret in my ear,
If tonight is all we own,
Let it last forever here.

[bridge]
Close your eyes, count to three,
Let the night take over,
Lose the fear, come with me,
We don't need no closure.

Ooh… yeah
Right here, right now

[final chorus]
Move slow, don't let go,
Feel the rhythm when we breathe,
Every beat, every tone,
Feels like where we're meant to be.

Say it soft, say it low,
Even if it disappears,
If tonight is all we own,
Let it live forever here.

[outro]
Mm…
Forever here
"""

class GenerateMusicResponse(BaseModel):
    audio_data: str


@app.cls(
    image=image,
    gpu="L40S",
    volumes={"/models/": model_volume, "/.cache/huggingface": hf_volume},
    secrets=[music_gen_secrets],
    scaledown_window=15
)
class MusicGenServer: 
    @modal.enter()
    def load_model(self):
        from acestep.pipeline_ace_step import ACEStepPipeline
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from diffusers import AutoPipelineForText2Image
        import torch

        # Music Gen Model - ACE Step
        self.music_model = ACEStepPipeline(
            checkpoint_dir="/models",
            dtype="bfloat16",
            torch_compile=False,
            cpu_offload=False,
            overlapped_decode=False 
            )

        # Large Language Model - Qwen
        model_id = "Qwen/Qwen2-7B-Instruct"
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        self.llm_model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype="auto",
        device_map="auto",
        cache_dir = "/.cache/huggingface"
)   

        self.image_pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16", cache_dir = "/.cache/huggingface" ) # type: ignore
        self.image_pipe.to("cuda")

    @modal.fastapi_endpoint(method="POST")
    def generate (self) -> GenerateMusicResponse:
        output_dir = "/tmp/outputs"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")

        self.music_model(
            prompt="Global pop, Latin pop, tropical pop, romantic, smooth summer vibe, warm guitar, soft percussion, melodic vocals, emotional, radio hit",
            lyrics= DEFAULT_LYRICS,
            audio_duration = 180,
            infer_step = 60,
            guidance_scale = 15,
            save_path = output_path
        )

        with open(output_path, "rb") as f:
            audio_bytes = f.read()

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        os.remove(output_path)
        return GenerateMusicResponse(audio_data=audio_b64)               
        

@app.local_entrypoint()
def main():
    server  = MusicGenServer()
    endpoint_url = server.generate.get_web_url()

    response = requests.post(endpoint_url)
    response.raise_for_status()
    result = GenerateMusicResponse(**response.json())

    audio_bytes = base64.b64decode(result.audio_data)
    output_filename = "generated.wav"

    with open(output_filename, "wb") as f:
        f.write(audio_bytes)
        