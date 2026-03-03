from langchain_community.retrievers import BM25Retriever
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_classic.retrievers import EnsembleRetriever
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
import pickle
from langchain_classic.retrievers.document_compressors import CrossEncoderReranker
from langchain_classic.retrievers import ContextualCompressionRetriever

EMBED_MODEL_ID = "BAAI/bge-base-en-v1.5"
class retriever:
    def __init__(self):
        pass

    def _HybridSearch(self)->list:
        with open("bm25_retriever.pkl", "rb") as f:
            bm25 = pickle.load(f)
        embd = HuggingFaceEmbeddings(model=EMBED_MODEL_ID)
        vdb=Chroma(persist_directory="krnatkadb",embedding_function=embd)
        chromadb=vdb.as_retriever(search_type="similarity",k=5)
        return [bm25,chromadb]
    
    def reranker(self):
        comb_db=self._HybridSearch()
        combined_db=EnsembleRetriever(retrievers=comb_db,weights=[0.5,0.5])
        reranker= HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-v2-m3")
        compressor=CrossEncoderReranker(model=reranker,top_n=5)
        final_retriever=ContextualCompressionRetriever(base_compressor=compressor,base_retriever=combined_db)
        return final_retriever
