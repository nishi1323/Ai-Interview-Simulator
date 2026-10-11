export function runCodingTests(source, challenge, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const workerSource = `
      self.onmessage = ({ data }) => {
        try {
          const invoke = new Function('args', data.source + '\\nreturn ' + data.functionName + '(...args);');
          const results = data.tests.map((test) => {
            const actual = invoke(test.args);
            const passed = JSON.stringify(actual) === JSON.stringify(test.expected);
            return { args: test.args, label: test.label, expected: test.expected, actual, passed };
          });
          self.postMessage({ results });
        } catch (error) {
          self.postMessage({ error: error.message || 'Unable to run this solution.' });
        }
      };
    `;
    const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    const worker = new Worker(blobUrl);
    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Execution timed out. Check for an infinite loop.'));
    }, timeoutMs);

    worker.onmessage = ({ data }) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      if (data.error) reject(new Error(data.error));
      else resolve(data.results);
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      reject(new Error(event.message || 'Could not run this solution.'));
    };
    worker.postMessage({ source, functionName: challenge.functionName, tests: challenge.tests });
  });
}