import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = isRegister ? 'http://localhost:3001/register' : 'http://localhost:3001/login';
    const body = isRegister
      ? { username, password, display_name: displayName }
      : { username, password };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          setUser(data);
          navigate('/');
        }
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} /><br />
        <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} /><br />
        {isRegister && (
          <input type="text" placeholder="Display Name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        )}<br />
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <br />
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Already have an account? Login' : 'No account? Register'}
      </button>
    </div>
  );
}

export default LoginPage;
