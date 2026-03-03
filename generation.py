from langchain.agents import create_agent
from langchain_core.tools import create_retriever_tool
from retriever import retriever
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os
from langgraph.checkpoint.memory import InMemorySaver


load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

llm = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct")
final_retriever = retriever().reranker()

tool = create_retriever_tool(
    final_retriever,
    name="eodb_retriever",
    description="this is the retriver containing information karnatka industrial policy 2025-2030",
)

checkpointer = InMemorySaver()
agent = create_agent(model=llm, tools=[tool], checkpointer=checkpointer)


def get_configurable(session_id: str) -> dict:
    """Return a LangGraph config dict scoped to the given session_id (thread)."""
    return {"configurable": {"thread_id": session_id}}

