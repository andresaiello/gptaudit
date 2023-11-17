import 'dotenv/config';
import fetch from 'node-fetch';
import JSZip from 'jszip';
import path from 'path';
import OpenAI from 'openai';

const FAKE_RESPONSE = {
  path:  "zeta-chain-zetachain-3a19731/packages/example-contracts/contracts/cross-chain-counter/CrossChainCounter.sol",
  response: "1. Lack of Input Validation: There is a lack of input validation, such as checking that the input parameters are not null or incorrect. For instance, the `crossChainCount` function could benefit from the inclusion of validations.\n   \n2. On the function `onZetaMessage` and `onZetaRevert`, `msg.sender` is unchecked. It should be validated whether `msg.sender` is from a trusted contract. \n\n3. Solidity version: Consider using the latest stable version of Solidity for optimal security and features.\n\n4. Code Commenting: The code lacks necessary commenting. Consider adding comments in your code to increase code readability and maintainability. This will help anyone reading your code to understand your logic and intention more effectively.\n\n5. In `onZetaMessage` and `onZetaRevert`, you are decoding the message without checking its length. This could result in `invalid opcode` if you try to access an element beyond the array length.\n\n6. Not Using Zeppelin's ReentrancyGuard: Critical functions like `crossChainCount` can potentially be abused via reentrancy attacks. To prevent this, it's recommended to inherit the \"ReentrancyGuard\" contract and to use the \"nonReentrant\" modifier from the OpenZeppelin library.\n\n7. Magic Number: The gas limit `2500000` is hardcoded in the `crossChainCount` function. It is generally recommended to avoid magic numbers in the code and use a well-named constant instead.\n\n8. Role-Based Access Control: The contract lacks role-based access controls. Consider using OpenZeppelin's AccessControl for flexible role-based permissions.\n\n9. Base Contracts: The contract inherits from ZetaInteractor and ZetaReceiver; however, the nature of the base contracts is unclear from this code. Ensure that base contracts are thoroughly audited and tested.\n\n10. Testing: Ensure comprehensive testing of the contract is done to ensure it behaves as expected in all scenarios. Unit and integration tests should aim to cover every line of the code. \n\n11. Overflows/Underflows: The Solidity 0.8.0 version used in the code has built-in overflow and underflow protection. However, older contracts may not have this protection, so please make sure that all arithmetic operations are safe from potential overflows and underflows.\n\n12. Upgradeability: The contract lacks a provision for upgradeability. Consider making the contract upgradeable to incorporate future improvements or to fix any potential bug that may be discovered in the future.\n"
}


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


interface SolidityFile {
    path: string;
    content: string;
  }

interface AuditResult {
  path: string;
  response: string;
}

const validateUrl = (url: string) => {
    const urlRegex = /^https:\/\/github\.com\/[A-z0-9_-]+\/[A-z0-9_-]+$/;
    return urlRegex.test(url);
  };
  
const fetchSolidityFiles = async (url: string) => {
    const repoName = url.split('github.com/')[1];
    console.log(`Fetching solidity files from ${repoName}`)
  
    const apiUrl = `https://api.github.com/repos/${repoName}/zipball/`;
    const response = await fetch(apiUrl);
    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
  
    const filePromises: Promise<SolidityFile>[] = [];
  
    zip.forEach((relativePath, file) => {
      if (path.extname(relativePath) === '.sol') {
        const filePromise = file.async('string').then(content => ({ path: relativePath, content }));
        filePromises.push(filePromise);
      }
    });
  
    const solidityFiles = await Promise.all(filePromises);
  
    return solidityFiles;
  }

  const  sendToChatPGT = async (solidityFile: SolidityFile):Promise<AuditResult | undefined> => {
    const prompt = `Please analyze this Solidity file for bugs, improvements, and general audit. Just list the things to improve or fix, no other comments. Enum the recomendations with numbers. The source code is this one: ${solidityFile.content}`;


    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: [{ role: 'user', content: prompt}],
      model: 'gpt-4',
    };
    const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
  
    if(chatCompletion?.choices.length === 0){
      return;
    }
    if(!chatCompletion?.choices[0].message){
      return;
    }
    if(!chatCompletion?.choices[0].message.content){
      return;
    }

    const result : AuditResult = {
      path: solidityFile.path,
      response: chatCompletion?.choices[0].message.content,
    }
    return result;
  }


export async function POST(request: any) {
  const body = await request.json();
  const { url } = body;

  if (!validateUrl(url)) return Response.json({ error: 'Invalid URL' });
    
  const solidityFiles = await fetchSolidityFiles(url)
  const result = await sendToChatPGT(solidityFiles[0]);
  const results = [result];
    // const results = [FAKE_RESPONSE];

  // const analysisPromises = solidityFiles.map(sendToChatPGT);
  // const results = await Promise.all(analysisPromises);

  return Response.json({ solidityFiles: results });
}

