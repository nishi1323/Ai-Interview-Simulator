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

  return (
    <div className="page-shell">
      <div className="card panel coding-panel">
        <div className="row-between">
          <div>
            <span className="eyebrow">Recommended practice</span>
            <h3>{challenge?.title || 'Coding practice'}</h3>
          </div>
          {challenge?.recommended && (
            <strong className="recommendation-label">
              {challenge.personalized ? 'Recommended from your latest results' : 'Suggested starter challenge'}
            </strong>
          )}
        </div>
        {loading && <p>Finding challenges for your latest interview…</p>}
        {error && <p className="alert error" role="alert">{error}</p>}
        {!loading && challenges.length === 0 && !error && (
          <p>Complete an interview to get targeted coding practice. <Link to="/interview-config">Start an interview</Link>.</p>
        )}
        {challenge && <>
          <label className="challenge-picker">Challenge
            <select value={challenge.id} onChange={chooseChallenge}>
              {challenges.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.difficulty}</option>)}
            </select>
          </label>
          <p>{challenge.prompt}</p>
        <div className="language-row">
          <span className="tag">JavaScript</span>
          <span className="tag">{challenge.focus}</span>
          <span className="tag">{challenge.difficulty}</span>
        </div>
        <textarea className="code-editor" rows="15" spellCheck="false" value={code} onChange={(event) => setCode(event.target.value)} aria-label="JavaScript solution" />
        <div className="row-between">
          <button className="primary-btn" type="button" onClick={runTests} disabled={running || !code.trim()}>
            {running ? 'Running…' : 'Run tests'}
          </button>
          {results && <strong>{results.filter((result) => result.passed).length}/{results.length} passed</strong>}
        </div>
        {results && <div className="coding-results" role="status">
          {results.map((result, index) => (
            <div key={`${result.label}-${index}`} className={result.passed ? 'coding-test passed' : 'coding-test failed'}>
              <strong>{result.passed ? 'PASS' : 'FAIL'}</strong>
              <code>{result.label}: {challenge.functionName}({result.args.map((arg) => JSON.stringify(arg)).join(', ')})</code>
              <span>Expected {JSON.stringify(result.expected)}, got {JSON.stringify(result.actual)}</span>
            </div>
          ))}
        </div>}
        </>}
      </div>
    </div>
  );
}
