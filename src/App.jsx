import React, { useState } from 'react';
import MenuScreen from './components/MenuScreen';
import SettingsScreen from './components/SettingsScreen';
import PlayScreen from './components/PlayScreen';
import SummaryScreen from './components/SummaryScreen';

function App() {
    const [gameState, setGameState] = useState('MENU'); // MENU, SETTINGS, PLAYING, SUMMARY
    const [config, setConfig] = useState({ categoryId: null, questions: 10 });
    const [result, setResult] = useState(null);

    const startSettings = (categoryId) => {
        setConfig({ ...config, categoryId });
        setGameState('SETTINGS');
    };

    const startPlay = (numQuestions) => {
        setConfig({ ...config, questions: numQuestions });
        setGameState('PLAYING');
    };

    const finishPlay = (stats) => {
        setResult(stats);
        setGameState('SUMMARY');
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>數 學 練 習 🐘</h1>
            </header>

            <main className="app-content">
                {gameState === 'MENU' && <MenuScreen onSelectCategory={startSettings} />}
                {gameState === 'SETTINGS' && <SettingsScreen onStart={startPlay} onBack={() => setGameState('MENU')} />}
                {gameState === 'PLAYING' && <PlayScreen categoryId={config.categoryId} totalQuestions={config.questions} onFinish={finishPlay} />}
                {gameState === 'SUMMARY' && <SummaryScreen result={result} onRestart={() => setGameState('MENU')} />}
            </main>
        </div>
    );
}

export default App;
