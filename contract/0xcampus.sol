// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CourseMarketplace {
    struct Course {
        address educator;
        string contentHash;
        uint256 price;
        uint256 refundPercentage;
        uint256 deadlineInDays;
    }
    
    mapping(uint256 => Course) public courses;
    mapping(address => mapping(uint256 => bool)) public enrollment;
    mapping(address => mapping(uint256 => uint256)) public enrollmentTime;
    mapping(address => mapping(uint256 => bool)) public completedCourses;
    
    uint256 public courseCount;
    
    event CourseCreated(uint256 courseId, address educator);
    event CourseEnrolled(uint256 courseId, address student);
    event CourseCompleted(uint256 courseId, address student, uint256 refundAmount);
    
    // Create a new course
    function createCourse(
        string memory _contentHash, 
        uint256 _price, 
        uint256 _refundPercentage, 
        uint256 _deadlineInDays
    ) public {
        require(_refundPercentage <= 100, "Refund percentage must be <= 100");
        courses[courseCount] = Course(msg.sender, _contentHash, _price, _refundPercentage, _deadlineInDays);
        emit CourseCreated(courseCount, msg.sender);
        courseCount++;
    }
    
    // Enroll in an existing course
    function enrollInCourse(uint256 _courseId) public payable {
        require(_courseId < courseCount, "Course does not exist");
        Course memory course = courses[_courseId];
        require(msg.value == course.price, "Incorrect payment amount");
        require(!enrollment[msg.sender][_courseId], "Already enrolled in this course");
        
        enrollment[msg.sender][_courseId] = true;
        enrollmentTime[msg.sender][_courseId] = block.timestamp;
        emit CourseEnrolled(_courseId, msg.sender);
    }
    
    // Complete a course and receive a refund if within deadline
    function completeCourse(uint256 _courseId) public {
        require(_courseId < courseCount, "Course does not exist");
        require(enrollment[msg.sender][_courseId], "Not enrolled in this course");
        require(!completedCourses[msg.sender][_courseId], "Course already completed");
        
        uint256 enrolledTime = enrollmentTime[msg.sender][_courseId];
        uint256 deadline = enrolledTime + (courses[_courseId].deadlineInDays * 1 days);
        
        completedCourses[msg.sender][_courseId] = true;
        uint256 refundAmount = 0;
        
        if (block.timestamp <= deadline) {
            refundAmount = (courses[_courseId].price * courses[_courseId].refundPercentage) / 100;
            require(address(this).balance >= refundAmount, "Insufficient balance for refund");
            payable(msg.sender).transfer(refundAmount);
        }
        emit CourseCompleted(_courseId, msg.sender, refundAmount);
    }
}
