### O que está implementado corretamente

- **Métricas de avaliação**: O script calcula macro accuracy por tipo, overall accuracy, erro médio de sentimento, erro médio de extração numérica e correlação de Spearman para sentimento, conforme especificado.
- **Matriz de confusão**: É gerada e exibida no console.
- **Per-Type Accuracy**: Calcula e exibe a acurácia por tipo.
- **Relatório de custo/falhas**: Calcula p50, p95, tempo médio batch=1 e batch=16, e total de falhas.
- **Detecção de casos difíceis**: Casos com tipo errado ou erro numérico são registrados em `trickyCases`.
- **Cálculo de erro absoluto para extração numérica**: Implementado para target_price, pct_change e range.
- **Cálculo de Spearman**: Implementado para sentimento.

### O que falta ou está incorreto


2. **Cobertura dos campos obrigatórios do output**
   - O script assume que o parser retorna todos os campos obrigatórios, mas não valida se todos estão presentes (ex: `notes`, `timeframe`, etc). Não há verificação de conformidade do output.

3. **Validação de normalização de tempo**
   - O README exige acurácia mínima de 75% na normalização de frases de tempo. O script não calcula essa métrica separadamente, apenas inclui o erro numérico e tipo.



5. **Relatório de custo/falhas expandido**
   - O README sugere que o relatório pode ser expandido, mas o script só mostra métricas básicas. Não há detalhamento de falhas por categoria ou análise de custo mais profunda.

6. **Cobertura de modularidade**
   - O README exige design modular para extrator numérico, normalizador de tempo e sentimento. O script depende de um único parser (`CryptoPredictionParser`) e não testa substituibilidade dos módulos.

7. **Testes de parsing de quotes/replies/reposts**
   - O README exige atribuição correta de autor em quotes/replies/reposts. O script não valida se o campo de notas ou autor está correto, apenas executa o parser.

8. **Preferência por precisão a recall**
   - O README exige que, na dúvida, o parser retorne `none` + nota. O script não valida se o parser está seguindo essa regra.

9. **Validação de tickers padronizados**
   - O README exige aceitação apenas de tickers padronizados. O script não valida se o parser está desambiguando corretamente.

10. **Cobertura de todos os exemplos do README**
    - Não há garantia que todos os exemplos do README estão cobertos nos testes do script.

---

### Resumo

O script cobre bem as métricas principais e a estrutura de avaliação, mas falta:

- Geração do arquivo `tricky_cases.md`
- Métricas específicas para normalização de tempo e extração numérica exata
- Validação de conformidade dos outputs
- Testes de modularidade e substituibilidade dos componentes
- Validação de regras de parsing (autor, precisão, tickers)
- Cobertura explícita dos exemplos do README
