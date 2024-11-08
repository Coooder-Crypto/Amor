"use client";

import Hero from "@/components/Hero";
import { createMetaMaskAccount, createDelegation } from "./quickstart";

import { useState } from "react";
import {
  DelegationStruct,
  Implementation,
  MetaMaskSmartAccount,
  getExplorerAddressLink,
} from "@codefi/delegator-core-viem";
import { chain } from "./examples/shared";
import { UserOperationReceipt } from "viem/account-abstraction";

import { Button } from "@mui/material";
import MyDialog from "@/components/MyDialog";

import Header from "@/components/Header";

interface Proposal {
  title: string;
  description: string;
  voted: boolean;
  address: `0x${string}`;
}

function Dashboard() {
  const proposals: Proposal[] = [
    {
      title: "Badgeholder Nomination Voting",
      description: "#88583 by sanzhi.eth · 62 votes · 1h ago",
      voted: true,
      address: "0x3f35CcFb1F4a3bA25c038bcb4f4f2176f06dE1c3",
    },
    {
      title: "Voting Cycle #9b: Protocol Delegation Elections",
      description: "#88583 by Coooder · 12 votes · 2d ago",
      voted: false,
      address: "0x36bA52643d13c2ba22B1d47D10546C7582B98C17",
    },
    {
      title: "Voting Cycle #7a: Protocol Delegation Elections",
      description: "#88583 by Coooder · 14 votes · 2y ago",
      voted: false,
      address: "0x36A9c762D61796464eD3fC8cF2F115365f7Fe0C3",
    },
  ];

  const voters = [
    {
      name: "sanzhi",
      self: 500,
      delegates: 300,
    },
    {
      name: "Coooder",
      self: 500,
      delegates: 200,
    },
  ];

  const [openDialog, setOpenDialog] = useState(false);
  const [isVote, setIsVote] = useState(false);

  const [delegatorAccount, setDelegatorAccount] =
    useState<MetaMaskSmartAccount<Implementation>>();
  const [delegateAccount, setDelegateAccount] =
    useState<MetaMaskSmartAccount<Implementation>>();
  const [delegation, setDelegation] = useState<DelegationStruct>();
  const [userOperationReceipt, setUserOperationReceipt] =
    useState<UserOperationReceipt>();

  const handleCreateDelegator = async () => {
    try {
      const delegator = await createMetaMaskAccount();
      setDelegatorAccount(delegator);

      const delegate = await createMetaMaskAccount();
      // Optionally set a specific address for the delegate account
      // delegate.address = "0x246d0e3e1FEb6428a7610A5f62c83146C3228D60";
      setDelegateAccount(delegate);
      console.log(delegate, delegator);
    } catch (error) {
      console.error("Error initializing accounts:", error);
    }
  };

  const handleVote = () => {
    setIsVote(true);
    setOpenDialog(true);
  };

  const handleDelegate = () => {
    setIsVote(false);
    setOpenDialog(true);
  };

  return (
    <div className="mx-auto">
      <Header />
      <Hero />
      <h2 className="text-2xl font-bold mb-4">
        Hello <span className="line-through">World</span>{" "}
        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-green-500">
          Amor
        </span>
      </h2>
      <div className="space-y-4">
        <div className="flex flex-row items-center gap-2">
          <h3 className="text-lg font-bold">
            Voter Account:{" "}
            {delegatorAccount && (
              <a
                href={getExplorerAddressLink(
                  chain.id,
                  delegatorAccount.address
                )}
                target="_blank"
                className="text-green-500 font-mono text-base"
              >
                0x246d0e3e1FEb6428a7610A5f62c83146C3228D60
              </a>
            )}
          </h3>
          {!delegatorAccount && (
            <button
              className="bg-white text-black rounded-md px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              onClick={handleCreateDelegator}
            >
              Get Your Address
            </button>
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold">Voters</h3>
          <div className="flex flex-wrap gap-4 mb-4 cursor-pointer">
            {voters.map((item, i) => {
              return (
                <div
                  className="rounded text-decoration-none bg-[rgb(36,41,46)] w-[calc(40%-0.5rem)] px-5 py-2.5 text-white hover:bg-[rgb(41,46,51)] hover:text-gray-300 transition duration-200 transform hover:scale-105"
                  key={i}
                  onClick={handleDelegate}
                >
                  <h3 className="text-xxl font-bold px-2">{item.name}</h3>
                  <div className="p-2 ">
                    <span className="text-xl font-bold">
                      {item.self + item.delegates}
                      {""}
                    </span>
                    <span className="mx-2">/</span>
                    {item.self} + {item.delegates}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold">Proposals</h3>

          {proposals.map((item) => {
            return (
              <div className="mt-2 p-2 pr-4 bg-gray-800 rounded flex flex-row items-center justify-between rounded-lg">
                <div className="p-2">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <div>{item.description}</div>
                </div>
                {item.voted ? (
                  <Button variant="outlined" disabled onClick={handleVote}>
                    Voted
                  </Button>
                ) : (
                  <Button variant="outlined" onClick={handleVote}>
                    Vote
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <MyDialog
          open={openDialog}
          onClose={setOpenDialog}
          isVote={isVote}
          delegation={delegation}
          userOperationReceipt={userOperationReceipt}
          delegate={delegateAccount}
          delegator={delegatorAccount}
        />
      </div>
    </div>
  );
}

export default Dashboard;
