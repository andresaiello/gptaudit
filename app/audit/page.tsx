'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import { StyledDiv, StyledForm, StyledButton, StyledInput, StyledResults } from './styles';

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateUrl(url)) {
        alert('Invalid github URL');
        return;
    }

    // Set loading to true and reset results
    setLoading(true);
    setResults(undefined);
    console.log('sending url', url)
    try {
      const response = await axios.post('/api/analyze', { url });
      console.log(response.data);
      setResults(response.data);
      setLoading(false);
      
    } catch (error) {
        setLoading(false);
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
        {loading ? (
          <p>Loading...</p>
        ) : results ? (
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
        ) : "No results"}
      
    </StyledResults>
    </StyledDiv>
  );

};

export default Home;