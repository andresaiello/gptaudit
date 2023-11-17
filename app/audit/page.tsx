'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const StyledDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh; // changed from height to min-height
  background-color: #f5f5f5;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;

const StyledInput = styled.input`
  width: 300px;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-size: 16px;
  color: #333;
`;

const StyledButton = styled.button`
  width: 100px;
  padding: 10px;
  border-radius: 5px;
  border: none;
  background-color: #0070f3;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0051bb;
  }
`;

const StyledResults = styled.div`
  width: 90%; // changed from 100% to 90%
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  color: #ccc;

  h2 {
    color: #000; // strong black
    font-weight: 900; // make it stronger than h3
  }

  h3 {
    color: #000; // strong black
    font-weight: bold; // make it bold
  }
`;

interface AuditResult {
    path: string;
    response: string;
  }

  interface Results {
    solidityFiles: AuditResult[];
  }

const Home = () => {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState<Results | undefined>(undefined);
  const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (results) {
            setLoading(false);
        }
    }, [results]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateUrl(url)) {
        alert('Invalid github URL');
        return;
    }

    console.log('sending url', url)
    try {
      const response = await axios.post('/api/analyze', { url });
      console.log(response.data);
      setResults(response.data);
      
    } catch (error) {
      console.error(error);
    }
  };

  const validateUrl = (url: string) => {
    const urlRegex = /^https:\/\/github\.com\/[A-z0-9_-]+\/[A-z0-9_-]+$/;
    return urlRegex.test(url);
  };

  return (
    <StyledDiv>
        <StyledForm onSubmit={handleSubmit}>
            <StyledInput
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter GitHub URL"
            />
            <StyledButton type="submit">Submit</StyledButton>
      </StyledForm>
      {loading ? (
        <p>Loading...</p>
      ) : null}
    <StyledResults>
      {results ? (
        <>
          <h2>Results ({results.solidityFiles.length})</h2>          
          {
            results.solidityFiles.map((file, index) =>  (
                <div key={index}>
                <h3>{file.path}</h3>
                {file.response.split('\n\n').map((item, key) => {
                    return <span key={key}>{item}<br /><br /></span>
                })}
                </div>
            ))
          }
        </>
      ) : "no results"}
    </StyledResults>
    </StyledDiv>
  );

};

export default Home;