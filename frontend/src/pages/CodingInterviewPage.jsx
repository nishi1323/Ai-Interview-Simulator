import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCodingChallenges } from '../services/api';
import { runCodingTests } from '../utils/runCodingTests';

export default function CodingInterviewPage() {
  const [searchParams] = useSearchParams();
  const [challenges, setChallenges] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getCodingChallenges()
      .then(({ data }) => {
        if (!active) return;
        setChallenges(data);
        const requestedId = searchParams.get('challenge');
        const selected = data.find((item) => item.id === requestedId)
          || data.find((item) => item.recommended)
          || data[0];
        setChallenge(selected || null);
        setCode(selected?.starterCode || '');
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load coding recommendations.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [searchParams]);

  const chooseChallenge = (event) => {
    const next = challenges.find((item) => item.id === event.target.value);
    if (!next) return;
    setChallenge(next);
    setCode(next.starterCode);
    setResults(null);
    setError('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = event.target;
      const updated = `${value.substring(0, selectionStart)}  ${value.substring(selectionEnd)}`;
      setCode(updated);
      requestAnimationFrame(() => {
        event.target.selectionStart = event.target.selectionEnd = selectionStart + 2;
      });
    }
  };

  const runTests = async () => {
    setRunning(true);
    setError('');
    setResults(null);
    try {
      setResults(await runCodingTests(code, challenge));
    } catch (runError) {
      setError(runError.message);
    } finally {
      setRunning(false);
    }
  };

  const passedCount = results ? results.filter((r) => r.passed).length : 0;
  const totalCount = results ? results.length : 0;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Technical Sandbox</span>
          <h2>Live Coding Challenge</h2>
          <p style={{ margin: '6px 0 0' }}>Write algorithms in an in-browser sandbox and run instant test suites to evaluate correctness and efficiency.</p>
        </div>
      </header>

      <div className="card panel coding-panel">
        <div className="row-between">
          <div>
            <span className="eyebrow">Algorithm Challenge</span>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.4rem' }}>{challenge?.title || 'Coding Practice'}</h3>
          </div>
          {challenge?.recommended && (
            <span className="badge badge-primary">
              {challenge.personalized ? '★ Recommended from your recent interviews' : '★ Recommended Starter'}
            </span>
          )}
        </div>

        {loading && <p>Loading coding challenges…</p>}
        {error && <p className="alert error" role="alert">{error}</p>}

        {!loading && challenges.length === 0 && !error && (
          <p>Complete an interview to get targeted coding practice. <Link className="primary-btn" to="/interview-config">Start an interview</Link></p>
        )}

        {challenge && (
          <>
            <div className="row-between" style={{ alignItems: 'flex-end', gap: '16px' }}>
              <label className="challenge-picker" style={{ flex: 1, maxWidth: '500px' }}>
                Select Challenge
                <select value={challenge.id} onChange={chooseChallenge}>
                  {challenges.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} · {item.difficulty} ({item.focus})
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="tag">JavaScript (ES6+)</span>
                <span className="tag">{challenge.focus}</span>
                <span className="badge badge-warning">{challenge.difficulty}</span>
              </div>
            </div>

            <div style={{ padding: '14px 18px', background: 'rgba(10, 18, 32, 0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: '#fff' }}>Problem Description</strong>
              <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.94rem' }}>{challenge.prompt}</p>
            </div>

            {/* Code Editor */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0a1220', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', border: '1px solid rgba(148, 163, 184, 0.2)', borderBottom: 'none' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  solution.js
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Press Tab for 2 spaces</span>
              </div>
              <textarea
                className="code-editor"
                style={{ borderRadius: '0 0 var(--radius-md) var(--radius-md)', borderTop: 'none', margin: 0 }}
                rows={14}
                spellCheck="false"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="JavaScript algorithm solution"
              />
            </div>

            <div className="row-between">
              <button
                className="primary-btn"
                type="button"
                onClick={runTests}
                disabled={running || !code.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {running ? 'Running Test Suite…' : 'Run Tests'}
              </button>

              {results && (
                <span className={`badge ${passedCount === totalCount ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                  {passedCount}/{totalCount} Tests Passed
                </span>
              )}
            </div>

            {/* Results breakdown */}
            {results && (
              <div className="coding-results" role="status">
                {results.map((result, index) => (
                  <div key={`${result.label}-${index}`} className={result.passed ? 'coding-test passed' : 'coding-test failed'}>
                    <strong>{result.passed ? 'PASS' : 'FAIL'}</strong>
                    <code>
                      {result.label}: {challenge.functionName}({result.args.map((arg) => JSON.stringify(arg)).join(', ')})
                    </code>
                    <span>
                      Expected: <code>{JSON.stringify(result.expected)}</code> | Output: <code>{JSON.stringify(result.actual)}</code>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
