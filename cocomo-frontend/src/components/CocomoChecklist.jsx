import React from 'react';

const Item = ({ code, title, bullets = [] }) => (
  <div className="mb-4">
    <div className="font-semibold">{code} — {title}</div>
    <ul className="list-disc pl-5 text-sm text-gray-700">
      {bullets.map((b, i) => <li key={i}>{b}</li>)}
    </ul>
  </div>
);

const CocomoChecklist = () => {
  return (
    <aside className="sticky top-4 bg-white border rounded p-4 max-h-[85vh] overflow-auto shadow-sm">
      <h3 className="text-lg font-bold mb-2">Guia rápido COCOMO</h3>
      <p className="text-xs text-gray-600 mb-4">
        Use as perguntas abaixo para escolher o nível (Muito Baixo → Muito Alto) de cada fator.
      </p>

      <h4 className="font-bold mt-2 mb-2">Fatores de Escala (SF)</h4>
      <Item code="PREC" title="Precedência do Projeto" bullets={[
        "Já fizemos projeto semelhante? Mesmo domínio/escopo?",
        "Temos lições aprendidas/histórico aplicável?"
      ]} />
      <Item code="FLEX" title="Flexibilidade de Processo" bullets={[
        "Há liberdade para adaptar o processo/escopo?",
        "O contrato/SLA é rígido ou aceita mudanças?"
      ]} />
      <Item code="RESL" title="Resolução de Riscos" bullets={[
        "Riscos mapeados e acompanhados? POCs/spikes?",
        "Planos de mitigação e reservas previstos?"
      ]} />
      <Item code="TEAM" title="Coesão da Equipe" bullets={[
        "Time já trabalhou junto? Papéis claros?",
        "Rotatividade baixa? Alinhamento entre áreas?"
      ]} />
      <Item code="PMAT" title="Maturidade do Processo" bullets={[
        "Processos documentados (requisitos/testes/CI-CD)?",
        "Padrões e manuais realmente seguidos?"
      ]} />

      <h4 className="font-bold mt-4 mb-2">Multiplicadores de Esforço (EM)</h4>
      <Item code="RCPX" title="Complexidade do Produto" bullets={[
        "Algoritmos/regra de negócio complexos?",
        "Muitas integrações/entradas/saídas críticas?"
      ]} />
      <Item code="RUSE" title="Reusabilidade Requerida" bullets={[
        "Produto precisa ser genérico/reutilizável?",
        "Componentização/configurabilidade exigida?"
      ]} />
      <Item code="PDIF" title="Dificuldade da Plataforma" bullets={[
        "Restrições de SO/hardware/rede? Tempo-real?",
        "Ambiente hostil (offline/embarcado)?"
      ]} />
      <Item code="PERS" title="Capacidade da Equipe" bullets={[
        "Proficiência técnica no stack?",
        "Boas práticas de design/testes?"
      ]} />
      <Item code="PREX" title="Experiência da Equipe" bullets={[
        "Experiência no domínio e ferramentas?",
        "Projetos semelhantes anteriores?"
      ]} />
      <Item code="FCIL" title="Apoio de Ferramentas" bullets={[
        "Automação (CI/CD, testes, IaC)?",
        "Ferramentas CASE/observabilidade/frameworks?"
      ]} />
      <Item code="SCED" title="Pressão de Cronograma" bullets={[
        "Prazo comprimido? SLAs curtos?",
        "Janela de entrega rígida?"
      ]} />

      <div className="text-xs text-gray-500 mt-4">
        Regra de bolso: se estiver na dúvida, marque <strong>Nominal</strong> e ajuste conforme evidências.
      </div>
    </aside>
  );
};

export default CocomoChecklist;
