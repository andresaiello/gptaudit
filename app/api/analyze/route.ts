import fetch from 'node-fetch';
import JSZip from 'jszip';
import path from 'path';
import OpenAI from 'openai';

const FAKE_RESPONSE = {
  path:  "zeta-chain-zetachain-3a19731/packages/example-contracts/contracts/cross-chain-counter/CrossChainCounter.sol",
  response: "The given smart contract `CrossChainCounter` extends from three contracts `ZetaInteractor`, `ZetaReceiver`, and `CrossChainCounterErrors`. It contains multiple functions and a constructor. Key highlights and areas of concern with this solidity file:\n\n1. All the necessary contracts have been imported.\n\n2. Variables are declared as public, meaning they can be accessed outside the contract.\n\n3. Solidity version used is 0.8.7 which is quite modern. Starting from Solidity 0.8.0, arithmetic operations revert on underflow and overflow, you don't need to use SafeMath for these operations any longer.\n\n4. The constructor is requiring `connectorAddress`, which is probably used in contracts inherited by `zetaInteractor`.\n\n5. The `crossChainCount` function increment the `counter` related to the `msg.sender` and makes a call to `connector.send`, which looks like it's forwarding a message to a different chain.\n\n6. The `onZetaMessage` function increments the `counter` related to `messageFrom`.\n\n7. It's not clear without the rest of the code what `ZetaInterfaces.SendInput` and `ZetaInterfaces.ZetaMessage` are, but it seems like they are ways to interact with different chains.\n\n8. In `onZetaRevert` function there is a check for decrement overflow which is good but not necessary in new solidity versions.\n\nLooking for potential improvements:\n\n- Though the contract seems safe against overflow errors, it would be best if the contract could guard against any potential reentrancy vulnerabilities. This is particularly applicable when the contract calls external contracts or implements a fallback function.\n  \n- Related to the previous point, I suggest using the Checks-Effects-Interactions Pattern to avoid reentrancy attacks. This implies that you should make any state changes before calling other contracts.\n\n- Consider adding more comments to make the contract codes more readable and maintainable.\n\n- Specification of the error messages being emitted by the contract for debugging purposes would be beneficial.\n\nOverall the contract looks fine but it's impossible to fully backup this conclusion without seeing the rest of the codebase, especially since it depends on numerous `send` and `recv` related calls which might be implemented poorly. Make sure those called contracts are properly audited and safe, have well-guarded permission levels, and are well-maintained. \n\nRemember, smart contract auditing usually involves a thorough, line-by-line manual review of the code and can be an inherently complex process requiring a deep understanding of the Solidity programming language, Ethereum, and the specific project’s architecture. It is always a good idea to have contracts audited by professional third-party service providers."
}


const openai = new OpenAI({
  apiKey: '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', // defaults to process.env["OPENAI_API_KEY"]
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

