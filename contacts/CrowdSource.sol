// SPDX-License-Identifier: MIT

pragma solidity >=0.8.2 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CrowdSource is Ownable {
    uint256 constant INITIAL_REPUTATION = 100;
    uint256 constant REPUTATION_SUCCESS = 10;
    uint256 constant REPUTATION_CANCEL = 20;
    uint256 constant REPUTATION_DISPUTE = 30;

    uint256 constant REFERRAL_PERCENTAGE = 10;
    uint256 constant TASK_EXPIRY = 7 days;
    uint256 constant JOB_EXPIRY = 30 days;
    
    struct Company {
        string name;
        string description; // logo, pic, desc, sql id
        address owner;
        uint256 balance;
        uint256 lockedBalance;
        uint256 totalJobs;
        uint256 reputation;
    }

    enum JobStatus {
        Open,
        InProgress,
        Completed,
        Cancelled,
        Disputed,
        Resolved 
    }
    
    struct Job {
        uint256 id;
        string title;
        address company;
        string description; // metadata, sql id

        address referrer; // refer
        address assigner; // assign
        uint256 percentage;

        uint256 totalPayment;
        uint256 paidAmount; // total paid
        uint256 totalTasks;
        uint256 taskIndex;

        uint256 updateTime;
        JobStatus status;
    }

    struct Referral {
        uint256 jobId;
        address referrer;
        address assigner;
        uint256 percentage;
    }

    // milestone
    struct Task {
        uint256 jobId;
        string description;
        uint256 startTime;
        bool completed;
    }

    enum TicketType {
        COMPANY,
        DEVELOPER
    }

    struct Ticket {
        uint256 jobId;
        uint256 taskId;
        TicketType ticketType;
        string description;
        uint256 startTime;
        bool completed;
    }

    uint256 public comCount;
    uint256 public devCount;
    uint256 public jobCount;
    Job[] public jobList;

    mapping(address => Company) public companies; // Company Address => Company
    mapping(address => uint256[]) public companyJobs; // Company Address => Job ID
    mapping(uint256 => Referral[]) public referrals; // Job ID => Referral
    mapping(uint256 => Ticket[]) public tickets; // Job ID => Ticket
    mapping(uint256 => mapping(uint256 => Task)) public tasks; // Job ID => Task ID => Task

    modifier onlyCompanyOwner(address _companyAddress) {
        require(companies[_companyAddress].owner == msg.sender, "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // company can only post jobs
    function createCompany(string memory _name, string memory _desc) external {
        require(companies[msg.sender].owner == address(0), "Company already exists");
        companies[msg.sender] = Company({
            name: _name,
            description: _desc,
            owner: msg.sender,
            balance: 0,
            lockedBalance: 0,
            totalJobs: 0,
            reputation: INITIAL_REPUTATION
        });
        comCount++;
    }

    function updateCompany(string memory _name, string memory _desc) public onlyCompanyOwner(msg.sender) {
        companies[msg.sender].name = _name;
        companies[msg.sender].description = _desc;
    }

    function deposit() external payable onlyCompanyOwner(msg.sender) {
        companies[msg.sender].balance += msg.value; // eth balance
    }

    function withdraw(uint256 _amount) external onlyCompanyOwner(msg.sender) {
        require(companies[msg.sender].balance >= _amount, "Insufficient balance");
        companies[msg.sender].balance -= _amount;
        payable(msg.sender).transfer(_amount);
    }

    // job
    function postJob(string memory _title, string memory _desc, uint256 _totalPayment, uint256 _tasks)  
        external onlyCompanyOwner(msg.sender) 
    {
        // _task < 5
        require(_tasks > 1 && _tasks < 5, "task count > 1 < 5");
        jobList.push(Job({
            id: jobCount,
            title: _title,
            company: msg.sender,
            description: _desc,
            referrer: address(0),
            assigner: address(0),
            percentage: 0,
            totalPayment: _totalPayment,
            paidAmount: 0,
            totalTasks: _tasks,
            taskIndex: 0,
            updateTime: block.timestamp,
            status: JobStatus.Open
        }));
        jobCount++;
    }

    function cancelJob(uint256 _jobIndex) external onlyCompanyOwner(msg.sender) {
        require(jobList[_jobIndex].status == JobStatus.Open, "Job not open");
        require(block.timestamp - jobList[_jobIndex].updateTime < JOB_EXPIRY, "Job expired");

        jobList[_jobIndex].status = JobStatus.Cancelled;
    }

    function reopenJob(uint256 _jobIndex) external onlyCompanyOwner(msg.sender) {
        require(jobList[_jobIndex].status == JobStatus.InProgress, "Job not cancelled");

        jobList[_jobIndex].status = JobStatus.Open;
    }

    // refer job
    function referJob(uint256 _jobIndex, address _assigner, uint256 _percentage) 
        external onlyCompanyOwner(msg.sender) 
    {
        require(jobList[_jobIndex].status == JobStatus.Open, "Job not open");
        require(_percentage >= 0 && _percentage < 30, "percentage >=0 <30");

        // if sender is assigner, percentage is 0
        if (msg.sender == _assigner) {
            referrals[_jobIndex].push(Referral({
              jobId: _jobIndex,
              referrer: msg.sender,
              assigner: _assigner,
              percentage: 0
          }));
        } else {
          referrals[_jobIndex].push(Referral({
            jobId: _jobIndex,
            referrer: msg.sender,
            assigner: _assigner,
            percentage: _percentage
          }));
        }

        // if assigner is empty, create a company
        if (companies[_assigner].owner == address(0)) {
            companies[_assigner] = Company({
                name: "DEV",
                description: "TBD",
                owner: _assigner,
                balance: 0,
                lockedBalance: 0,
                totalJobs: 0,
                reputation: INITIAL_REPUTATION
            });
            devCount++;
        }
    }

    // assign job
    function assignJob(uint256 _jobIndex, uint256 _referrerIndex) 
        external onlyCompanyOwner(msg.sender) 
    {
        require(jobList[_jobIndex].status == JobStatus.Open, "Job not open");
        require(tasks[_jobIndex][1].startTime != 0, "Task already added");

        jobList[_jobIndex].referrer = referrals[_jobIndex][_referrerIndex].referrer;
        jobList[_jobIndex].assigner = referrals[_jobIndex][_referrerIndex].assigner;
        jobList[_jobIndex].percentage = referrals[_jobIndex][_referrerIndex].percentage;
        
        // update job status to in progress
        jobList[_jobIndex].status = JobStatus.InProgress; 
        jobList[_jobIndex].updateTime = block.timestamp;

        // pay first round
        _payJob(_jobIndex, 0);
    }

    // add Task
    function addTask(uint256 _jobIndex, uint256 _taskIndex, string memory _description) 
        external onlyCompanyOwner(msg.sender) 
    {
        require(jobList[_jobIndex].status == JobStatus.Open || 
                jobList[_jobIndex].status == JobStatus.InProgress, "Job not open or in progress");
        require(_taskIndex > 0 && _taskIndex < jobList[_jobIndex].totalTasks, "task index less than total tasks");
        require(tasks[_jobIndex][_taskIndex].startTime != 0, "Task already added");
        
        // add task
        tasks[_jobIndex][_taskIndex] = Task({
            jobId: _jobIndex,
            description: _description,
            startTime: block.timestamp,
            completed: false
        });
    }

    function completeTask(uint256 _jobIndex, uint256 _taskIndex) 
        external onlyCompanyOwner(msg.sender) 
    {
        require(jobList[_jobIndex].status == JobStatus.InProgress, "Job not in progress");
        require(jobList[_jobIndex].taskIndex == _taskIndex, "task index not the same");
        require(tasks[_jobIndex][_taskIndex].startTime != 0, "Task not started");

        _payJob(_jobIndex, _taskIndex);

         tasks[_jobIndex][_taskIndex].completed = true;
        if (jobList[_jobIndex].taskIndex == jobList[_jobIndex].totalTasks) {
            jobList[_jobIndex].status = JobStatus.Completed;
        } 
        
    }

    // 0号任务，开始先打钱，然后锁定1号任务的资金，最后从锁定的资金转出，保证下个任务资金足够
    function _payJob(uint256 _jobIndex, uint _taskIndex) private {
        // calculate refer amount
        uint256 amount = jobList[_jobIndex].totalPayment / jobList[_jobIndex].totalTasks;
        uint256 percent = jobList[_jobIndex].percentage;
        uint256 referAmount = amount * percent / 100;

        // company balance
        if (_taskIndex != jobList[_jobIndex].totalTasks - 1) {
            require(companies[jobList[_jobIndex].company].balance >= amount, "Insufficient balance");
            companies[jobList[_jobIndex].company].balance -= amount;
            if (_taskIndex == 0) {
                // 开始先打钱
                require(companies[jobList[_jobIndex].company].balance >= amount, "Insufficient balance");
                companies[jobList[_jobIndex].company].balance -= amount;
                companies[jobList[_jobIndex].company].lockedBalance += amount;
            }
        } else {

            require(companies[jobList[_jobIndex].company].lockedBalance >= amount, "Insufficient lock balance");
            companies[jobList[_jobIndex].company].lockedBalance -= amount;
        }

        // assigner balance
        if (percent == 0) {
            companies[jobList[_jobIndex].assigner].balance += amount;
        } else {
            companies[jobList[_jobIndex].referrer].balance += referAmount;
            companies[jobList[_jobIndex].assigner].balance += amount - referAmount;
        }

        jobList[_jobIndex].taskIndex++;
    }

    function createTicket(uint256 _jobIndex, uint256 _taskIndex, string memory _description) 
        external 
        onlyCompanyOwner(msg.sender) 
    {
        require(jobList[_jobIndex].status == JobStatus.InProgress || 
                jobList[_jobIndex].status == JobStatus.Disputed, "Job not in progress or disputed");
        require(!tasks[_jobIndex][_taskIndex].completed, "Task already completed");
        require(block.timestamp - tasks[_jobIndex][_taskIndex].startTime < TASK_EXPIRY, "Task expired");

        if (msg.sender == jobList[_jobIndex].company) {
          tickets[_jobIndex].push(Ticket({
              jobId: _jobIndex,
              taskId: _taskIndex,
              ticketType: TicketType.COMPANY, // from company
              description: _description,
              startTime: block.timestamp,
              completed: false
          }));
        } else if (msg.sender == jobList[_jobIndex].assigner || 
                   msg.sender == jobList[_jobIndex].referrer) {
            tickets[_jobIndex].push(Ticket({
                jobId: _jobIndex,
                taskId: _taskIndex,
                ticketType: TicketType.DEVELOPER,
                description: _description,
                startTime: block.timestamp,
                completed: false
            }));
        } else {
            revert("Not authorized");
        } 
        jobList[_jobIndex].status = JobStatus.Disputed;   
    }

    function resolveTicket(uint256 _jobIndex, uint256 _ticketIndex) external onlyOwner {
        require(!tickets[_jobIndex][_ticketIndex].completed, "Ticket already completed");
        require(jobList[_jobIndex].status == JobStatus.Disputed, "Job not disputed");
        
        uint256 amount = jobList[_jobIndex].totalPayment / jobList[_jobIndex].totalTasks;
        require(companies[jobList[_jobIndex].company].lockedBalance >= amount, "Insufficient lock balance");
        companies[jobList[_jobIndex].company].lockedBalance -= amount;

        if (tickets[_jobIndex][_ticketIndex].ticketType == TicketType.COMPANY) {
            companies[jobList[_jobIndex].assigner].reputation -= REPUTATION_DISPUTE;
            companies[jobList[_jobIndex].company].balance += amount;
        } else {
            companies[jobList[_jobIndex].company].reputation -= REPUTATION_DISPUTE;
            companies[jobList[_jobIndex].assigner].balance += amount;
        }

        // task completed
        tasks[_jobIndex][tickets[_jobIndex][_ticketIndex].taskId].completed = true;
        tickets[_jobIndex][_ticketIndex].completed = true;
        jobList[_jobIndex].status = JobStatus.Resolved;
    }
}