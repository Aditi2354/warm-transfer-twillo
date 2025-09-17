import os, httpx

PROV = os.getenv("LLM_PROVIDER","openai").lower()

def summarize_text(text: str) -> str:
    system = "You are a helpful assistant that produces crisp warm-handoff call summaries with 3-5 bullets and clear action items."
    user = f"Summarize this call for a warm transfer. Be concise. Add 'Action Items:' list at the end.\n\n{text}"
    if PROV == "openai":
        try:
            import openai  # optional if user has openai package; fallback via httpx if not
            from openai import OpenAI
            client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
            res = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role":"system","content":system},{"role":"user","content":user}],
                temperature=0.2,
            )
            return res.choices[0].message.content.strip()
        except Exception:
            # httpx fallback to OpenAI REST
            headers = {"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}", "Content-Type":"application/json"}
            data = {"model":"gpt-4o-mini","messages":[{"role":"system","content":system},{"role":"user","content":user}],"temperature":0.2}
            r = httpx.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data, timeout=60)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"].strip()
    elif PROV == "groq":
        headers = {"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}", "Content-Type":"application/json"}
        data = {"model":"llama-3.1-8b-instant","messages":[{"role":"system","content":system},{"role":"user","content":user}],"temperature":0.2}
        r = httpx.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data, timeout=60)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
    else:  # openrouter
        headers = {"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}", "Content-Type":"application/json"}
        data = {"model":"openrouter/auto","messages":[{"role":"system","content":system},{"role":"user","content":user}],"temperature":0.2}
        r = httpx.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data, timeout=60)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
