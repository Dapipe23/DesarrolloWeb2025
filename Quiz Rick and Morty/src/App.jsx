import React, { useEffect, useState } from 'react';
import Header from './assets/header';
import CharacterCard from './assets/CharacterCard';
import './App.css';

const App = () => {
    const [characters, setCharacters] = useState([]);

    useEffect(() => {
        const fetchCharacters = async () => {
            try {
                const response = await fetch('https://rickandmortyapi.com/api/character/?page=1');
                const data = await response.json();
                setCharacters(data.results.slice(0, 9));
            } catch (error) {
                console.error('Error fetching characters:', error);
            }
        };

        fetchCharacters();
    }, []);

    return (
        <div>
            <Header />
            <div className="character-list">
                {characters.map(character => (
                    <CharacterCard key={character.id} character={character} />
                ))}
            </div>
        </div>
    );
};

export default App;