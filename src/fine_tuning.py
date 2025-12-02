"""Fine-tuning utilities for Ollama models"""
from pathlib import Path
from typing import List, Dict


class FineTuner:
    """Fine-tuning support for Ollama models"""
    
    def prepare_training_data(self, qa_pairs: List[Dict[str, str]]) -> str:
        """Prepare training data in Ollama Modelfile format"""
        modelfile_content = []
        
        for pair in qa_pairs:
            question = pair.get("question", "")
            answer = pair.get("answer", "")
            modelfile_content.append(f'MESSAGE user "{question}"')
            modelfile_content.append(f'MESSAGE assistant "{answer}"')
        
        return "\n".join(modelfile_content)
    
    def create_modelfile(self, base_model: str, training_data: str, 
                        output_path: Path) -> None:
        """Create Modelfile for fine-tuning"""
        modelfile = f"""FROM {base_model}

# Training examples
{training_data}

# System prompt
SYSTEM Ты полезный AI-ассистент, который отвечает на вопросы на основе предоставленного контекста.
"""
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(modelfile)
        
        print(f"Modelfile created at: {output_path}")
        print("To create custom model, run:")
        print(f"ollama create custom-model -f {output_path}")
