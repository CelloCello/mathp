import React, { useState } from 'react';
import MenuScreen from './components/MenuScreen';
import UnitScreen from './components/UnitScreen';
import SettingsScreen from './components/SettingsScreen';
import PlayScreen from './components/PlayScreen';
import SummaryScreen from './components/SummaryScreen';
import { createQuestionSet, getSelectionLabels } from './game/session.js';

function App() {
    const [gameState, setGameState] = useState('MENU'); // MENU, UNIT, SETTINGS, PLAYING, SUMMARY
    const [config, setConfig] = useState({
        categoryId: null,
        unitId: null,
        questionCount: 10,
        questions: []
    });
    const [result, setResult] = useState(null);

    const goHome = () => {
        setGameState('MENU');
    };

    const startUnitSelection = (categoryId) => {
        setConfig((previous) => ({
            ...previous,
            categoryId,
            unitId: null,
            questions: []
        }));
        setGameState('UNIT');
    };

    const startSettings = (unitId) => {
        setConfig((previous) => ({
            ...previous,
            unitId
        }));
        setGameState('SETTINGS');
    };

    const startPlay = (numQuestions) => {
        const generatedQuestions = createQuestionSet(config.categoryId, config.unitId, numQuestions);

        setConfig((previous) => ({
            ...previous,
            questionCount: numQuestions,
            questions: generatedQuestions
        }));
        setGameState('PLAYING');
    };

    const finishPlay = (stats) => {
        setResult({
            ...stats,
            ...getSelectionLabels(config.categoryId, config.unitId)
        });
        setGameState('SUMMARY');
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>數 學 練 習 🐘</h1>
            </header>

            <main className="app-content">
                {gameState === 'MENU' && <MenuScreen onSelectCategory={startUnitSelection} />}
                {gameState === 'UNIT' && (
                    <UnitScreen
                        categoryId={config.categoryId}
                        onSelectUnit={startSettings}
                        onBack={goHome}
                    />
                )}
                {gameState === 'SETTINGS' && (
                    <SettingsScreen
                        categoryId={config.categoryId}
                        unitId={config.unitId}
                        onStart={startPlay}
                        onBack={() => setGameState('UNIT')}
                    />
                )}
                {gameState === 'PLAYING' && (
                    <PlayScreen
                        key={`${config.categoryId}-${config.unitId}-${config.questionCount}`}
                        categoryId={config.categoryId}
                        unitId={config.unitId}
                        questions={config.questions}
                        onFinish={finishPlay}
                        onGoHome={goHome}
                        onRestart={() => setGameState('SETTINGS')}
                    />
                )}
                {gameState === 'SUMMARY' && <SummaryScreen result={result} onRestart={goHome} />}
            </main>
        </div>
    );
}

export default App;
