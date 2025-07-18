from dotenv import load_dotenv
from openai import AsyncOpenAI, OpenAI
import openai
from typing import List
import os
import asyncio


class EmbeddingModel:
    def __init__(self, embeddings_model_name: str = "text-embedding-3-small", api_key: str = None):
        load_dotenv()
        
        # Use provided API key or fall back to environment variable
        if api_key:
            self.openai_api_key = api_key
        else:
            self.openai_api_key = os.getenv("OPENAI_API_KEY")
            
        if self.openai_api_key is None:
            raise ValueError(
                "OpenAI API key is required. Please provide it as a parameter or set the OPENAI_API_KEY environment variable."
            )
            
        # Initialize clients with the API key
        self.async_client = AsyncOpenAI(api_key=self.openai_api_key)
        self.client = OpenAI(api_key=self.openai_api_key)
        
        openai.api_key = self.openai_api_key
        self.embeddings_model_name = embeddings_model_name

    async def async_get_embeddings(self, list_of_text: List[str]) -> List[List[float]]:
        embedding_response = await self.async_client.embeddings.create(
            input=list_of_text, model=self.embeddings_model_name
        )

        return [embeddings.embedding for embeddings in embedding_response.data]

    async def async_get_embedding(self, text: str) -> List[float]:
        embedding = await self.async_client.embeddings.create(
            input=text, model=self.embeddings_model_name
        )

        return embedding.data[0].embedding

    def get_embeddings(self, list_of_text: List[str]) -> List[List[float]]:
        embedding_response = self.client.embeddings.create(
            input=list_of_text, model=self.embeddings_model_name
        )

        return [embeddings.embedding for embeddings in embedding_response.data]

    def get_embedding(self, text: str) -> List[float]:
        embedding = self.client.embeddings.create(
            input=text, model=self.embeddings_model_name
        )

        return embedding.data[0].embedding


if __name__ == "__main__":
    embedding_model = EmbeddingModel()
    print(asyncio.run(embedding_model.async_get_embedding("Hello, world!")))
    print(
        asyncio.run(
            embedding_model.async_get_embeddings(["Hello, world!", "Goodbye, world!"])
        )
    )
