# Sistema "Meu Cantinho"
## Trabalho final da disciplina de Design de Software - UFPR.

### Especificação
O trabalho consiste em um sistema para a rede de lojas de aluguel de espaços para festas "Meu Cantinho". O Sistema tem como proposta resolver os problemas de falta de coerência de dados, intolerância a falhas e falta de escalabilidade enfrentados pelo sistema antigo da empresa. Para uma solução adequada, foi utilizada a arquitetura orientada à eventos, implementando um broker "fake" para fins didáticos.

### Instalação
Para instalar o sistema, o usuário deve ulizar uma máquina Linux com Docker em versão 28.4.0 ou superior e clonar o repositório para a sua máquina.

### Execução
Para executar o sistema, basta rodar "$sudo docker compose up" na root do diretório e abrir o link http://localhost:8080 em seu navegador. Com isto, o usuário consegue gerenciar os espaços, reserva-los, gerenciar usuários e realizar pagamentos.
