import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './components/LoginPage';
import ChannelList from './components/ChannelList';
import ChannelMessages from './components/ChannelMessages';


function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <ChannelList user={user} setUser={setUser} /> : <LoginPage setUser={setUser} />} />
        <Route path="/channels/:channelId" element={<ChannelMessages user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;