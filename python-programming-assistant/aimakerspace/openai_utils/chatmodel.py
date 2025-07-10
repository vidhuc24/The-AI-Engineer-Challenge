from openai import OpenAI, AsyncOpenAI
from dotenv import load_dotenv
import os

load_dotenv()


class ChatOpenAI:
    def __init__(self, model_name: str = "gpt-4o-mini", api_key: str = None):
        self.model_name = model_name
        
        # Use provided API key or fall back to environment variable
        if api_key:
            self.openai_api_key = api_key
        else:
            self.openai_api_key = os.getenv("OPENAI_API_KEY")
            
        if self.openai_api_key is None:
            raise ValueError("OpenAI API key is required. Please provide it as a parameter or set the OPENAI_API_KEY environment variable.")

    def run(self, messages, text_only: bool = True, **kwargs):
        if not isinstance(messages, list):
            raise ValueError("messages must be a list")

        client = OpenAI(api_key=self.openai_api_key)
        response = client.chat.completions.create(
            model=self.model_name, messages=messages, **kwargs
        )

        if text_only:
            return response.choices[0].message.content

        return response
    
    async def astream(self, messages, **kwargs):
        if not isinstance(messages, list):
            raise ValueError("messages must be a list")
        
        client = AsyncOpenAI(api_key=self.openai_api_key)

        stream = await client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            stream=True,
            **kwargs
        )

        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content is not None:
                yield content
