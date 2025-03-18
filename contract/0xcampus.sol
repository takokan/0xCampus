// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EducationalPlatform
 * @dev Smart contract for an educational platform where educators post content and learners can get partial refunds
 */
contract EducationalPlatform {
    // Structs
    struct Course {
        address educator;
        string title;
        string description;
        string ipfsHash;  // IPFS hash for the video content
        uint256 price;
        uint256 completionTimeLimit; // in seconds
        uint8 refundPercentage; // percentage of refund upon completion
        bool isActive;
    }
    
    struct Enrollment {
        uint256 courseId;
        uint256 enrollmentTime;
        uint256 completionDeadline;
        bool isCompleted;
        bool isRefunded;
    }
    
    // State variables
    uint256 private courseCounter;
    mapping(uint256 => Course) public courses;
    mapping(address => mapping(uint256 => Enrollment)) public enrollments;
    mapping(address => uint256[]) public userEnrollments;
    mapping(address => uint256[]) public educatorCourses;
    mapping(address => uint256) public educatorBalance;
    
    // Events
    event CourseCreated(uint256 indexed courseId, address indexed educator, string title, uint256 price);
    event CourseEnrolled(uint256 indexed courseId, address indexed learner, uint256 price);
    event CourseCompleted(uint256 indexed courseId, address indexed learner);
    event RefundProcessed(uint256 indexed courseId, address indexed learner, uint256 amount);
    event BalanceWithdrawn(address indexed educator, uint256 amount);
    
    // Modifiers
    modifier onlyCourseEducator(uint256 _courseId) {
        require(courses[_courseId].educator == msg.sender, "Not the course educator");
        _;
    }
    
    modifier courseExists(uint256 _courseId) {
        require(_courseId < courseCounter, "Course does not exist");
        require(courses[_courseId].isActive, "Course is not active");
        _;
    }
    
    modifier notEnrolled(uint256 _courseId) {
        require(enrollments[msg.sender][_courseId].enrollmentTime == 0, "Already enrolled");
        _;
    }
    
    modifier isEnrolled(uint256 _courseId) {
        require(enrollments[msg.sender][_courseId].enrollmentTime > 0, "Not enrolled");
        _;
    }
    
    /**
     * @dev Create a new course with educational content
     * @param _title Course title
     * @param _description Course description
     * @param _ipfsHash IPFS hash for the video content
     * @param _price Course price in wei
     * @param _completionTimeLimit Time limit for completion in seconds
     * @param _refundPercentage Percentage of refund upon completion
     */
    function createCourse(
        string memory _title, 
        string memory _description, 
        string memory _ipfsHash, 
        uint256 _price, 
        uint256 _completionTimeLimit, 
        uint8 _refundPercentage
    ) external {
        require(_refundPercentage <= 100, "Refund percentage cannot exceed 100%");
        
        uint256 courseId = courseCounter;
        
        courses[courseId] = Course({
            educator: msg.sender,
            title: _title,
            description: _description,
            ipfsHash: _ipfsHash,
            price: _price,
            completionTimeLimit: _completionTimeLimit,
            refundPercentage: _refundPercentage,
            isActive: true
        });
        
        educatorCourses[msg.sender].push(courseId);
        courseCounter++;
        
        emit CourseCreated(courseId, msg.sender, _title, _price);
    }
    
    /**
     * @dev Enroll in a course by paying the price
     * @param _courseId ID of the course to enroll in
     */
    function enrollInCourse(uint256 _courseId) external payable courseExists(_courseId) notEnrolled(_courseId) {
        Course memory course = courses[_courseId];
        require(msg.value == course.price, "Incorrect payment amount");
        
        // Add enrollment
        enrollments[msg.sender][_courseId] = Enrollment({
            courseId: _courseId,
            enrollmentTime: block.timestamp,
            completionDeadline: block.timestamp + course.completionTimeLimit,
            isCompleted: false,
            isRefunded: false
        });
        
        userEnrollments[msg.sender].push(_courseId);
        
        // Add payment to educator's balance
        educatorBalance[course.educator] += msg.value;
        
        emit CourseEnrolled(_courseId, msg.sender, course.price);
    }
    
    /**
     * @dev Mark a course as completed by the educator
     * @param _learner Address of the learner
     * @param _courseId ID of the course to mark as completed
     */
    function markCourseCompleted(address _learner, uint256 _courseId) external courseExists(_courseId) onlyCourseEducator(_courseId) {
        Enrollment storage enrollment = enrollments[_learner][_courseId];
        require(enrollment.enrollmentTime > 0, "Learner not enrolled");
        require(!enrollment.isCompleted, "Course already completed");
        
        enrollment.isCompleted = true;
        
        emit CourseCompleted(_courseId, _learner);
        
        // Process refund if completed before deadline
        if (block.timestamp <= enrollment.completionDeadline && !enrollment.isRefunded) {
            processRefund(_learner, _courseId);
        }
    }
    
    /**
     * @dev Process refund for completing the course on time
     * @param _learner Address of the learner
     * @param _courseId ID of the completed course
     */
    function processRefund(address _learner, uint256 _courseId) internal {
        Enrollment storage enrollment = enrollments[_learner][_courseId];
        Course memory course = courses[_courseId];
        
        uint256 refundAmount = (course.price * course.refundPercentage) / 100;
        
        // Update balances
        educatorBalance[course.educator] -= refundAmount;
        enrollment.isRefunded = true;
        
        // Transfer refund to learner
        (bool success, ) = payable(_learner).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit RefundProcessed(_courseId, _learner, refundAmount);
    }
    
    /**
     * @dev Withdraw educator's balance
     */
    function withdrawBalance() external {
        uint256 amount = educatorBalance[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        // Reset balance before transfer to prevent reentrancy
        educatorBalance[msg.sender] = 0;
        
        // Transfer funds
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal transfer failed");
        
        emit BalanceWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Update course details
     * @param _courseId ID of the course to update
     * @param _title New course title
     * @param _description New course description
     * @param _ipfsHash New IPFS hash
     * @param _price New course price
     * @param _completionTimeLimit New completion time limit
     * @param _refundPercentage New refund percentage
     * @param _isActive Course active status
     */
    function updateCourse(
        uint256 _courseId,
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _price,
        uint256 _completionTimeLimit,
        uint8 _refundPercentage,
        bool _isActive
    ) external onlyCourseEducator(_courseId) {
        require(_refundPercentage <= 100, "Refund percentage cannot exceed 100%");
        
        Course storage course = courses[_courseId];
        
        course.title = _title;
        course.description = _description;
        course.ipfsHash = _ipfsHash;
        course.price = _price;
        course.completionTimeLimit = _completionTimeLimit;
        course.refundPercentage = _refundPercentage;
        course.isActive = _isActive;
    }
    
    /**
     * @dev Get all courses created by an educator
     * @param _educator Address of the educator
     * @return Array of course IDs
     */
    function getEducatorCourses(address _educator) external view returns (uint256[] memory) {
        return educatorCourses[_educator];
    }
    
    /**
     * @dev Get all courses a learner is enrolled in
     * @param _learner Address of the learner
     * @return Array of course IDs
     */
    function getLearnerEnrollments(address _learner) external view returns (uint256[] memory) {
        return userEnrollments[_learner];
    }
    
    /**
     * @dev Get enrollment details for a learner and course
     * @param _learner Address of the learner
     * @param _courseId ID of the course
     * @return enrollmentTime The timestamp when the learner enrolled
     * @return completionDeadline The deadline by which the course must be completed
     * @return isCompleted Whether the course has been completed
     * @return isRefunded Whether the refund has been processed
     */
    function getEnrollmentDetails(address _learner, uint256 _courseId) external view returns (
        uint256 enrollmentTime,
        uint256 completionDeadline,
        bool isCompleted,
        bool isRefunded
    ) {
        Enrollment memory enrollment = enrollments[_learner][_courseId];
        return (
            enrollment.enrollmentTime,
            enrollment.completionDeadline,
            enrollment.isCompleted,
            enrollment.isRefunded
        );
    }
}