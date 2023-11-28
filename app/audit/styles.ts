import styled from 'styled-components';

export const StyledDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh; // changed from height to min-height
  background-color: #f5f5f5;
`;

export const StyledForm = styled.form`
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

export const StyledInput = styled.input`
  width: 600px;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-size: 16px;
  color: #333;
`;

export const StyledButton = styled.button`
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

export const StyledResults = styled.div`
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
