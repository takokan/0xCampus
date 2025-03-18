// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../0xcampus.sol";

contract EducationalPlatformTest {
    EducationalPlatform platform;
    
    // Test accounts
    address acc0;
    address acc1;
    address acc2;
    
    // Test course data
    string title = "Blockchain Basics";
    string description = "Learn the fundamentals of blockchain technology";
    string ipfsHash = "QmTest123456789";
    uint256 price = 0.05 ether;
    uint256 timeLimit = 14 days;
    uint8 refundPercent = 40;
    uint256 courseId = 0;
    
    /// Deploy contract and set up accounts
    function beforeAll() public {
        acc0 = TestsAccounts.getAccount(0); // Contract deployer
        acc1 = TestsAccounts.getAccount(1); // Educator
        acc2 = TestsAccounts.getAccount(2); // Learner
        
        // Deploy contract from acc0
        platform = new EducationalPlatform();
    }
    
    /// Test course creation functionality
    /// #sender: account-1
    function testCourseCreation() public {
        // Create a course as educator (acc1)
        platform.createCourse(
            title,
            description,
            ipfsHash,
            price,
            timeLimit,
            refundPercent
        );
        
        // Get course details
        (
            address educator,
            string memory _title,
            string memory _description,
            string memory _ipfsHash,
            uint256 _price,
            uint256 _timeLimit,
            uint8 _refundPercent,
            bool active
        ) = platform.courses(courseId);
        
        // Verify course details
        Assert.equal(educator, acc1, "Educator address mismatch");
        Assert.equal(_title, title, "Title mismatch");
        Assert.equal(_description, description, "Description mismatch");
        Assert.equal(_ipfsHash, ipfsHash, "IPFS hash mismatch");
        Assert.equal(_price, price, "Price mismatch");
        Assert.equal(_timeLimit, timeLimit, "Time limit mismatch");
        Assert.equal(uint256(_refundPercent), uint256(refundPercent), "Refund percentage mismatch");
        Assert.equal(active, true, "Course should be active");
        
        // Check educator courses
        uint256[] memory courses = platform.getEducatorCourses(acc1);
        Assert.equal(courses.length, 1, "Educator should have 1 course");
        Assert.equal(courses[0], courseId, "Course ID mismatch");
    }
    
    /// Test course enrollment functionality
    /// #sender: account-2
    /// #value: 50000000000000000
    function testEnrollment() public {
        // Enroll in the course as learner (acc2)
        platform.enrollInCourse(courseId);
        
        // Check enrollment details
        (
            uint256 enrollTime,
            uint256 deadline,
            bool completed,
            bool refunded
        ) = platform.getEnrollmentDetails(acc2, courseId);
        
        // Verify enrollment
        Assert.notEqual(enrollTime, 0, "Enrollment time should be set");
        Assert.equal(deadline, enrollTime + timeLimit, "Deadline should be enrollment time + time limit");
        Assert.equal(completed, false, "Course should not be completed yet");
        Assert.equal(refunded, false, "Refund should not be processed yet");
        
        // Check learner enrollments
        uint256[] memory enrollments = platform.getLearnerEnrollments(acc2);
        Assert.equal(enrollments.length, 1, "Learner should have 1 enrollment");
        Assert.equal(enrollments[0], courseId, "Enrolled course ID mismatch");
        
        // Check educator balance
        uint256 educatorBalance = platform.educatorBalance(acc1);
        Assert.equal(educatorBalance, price, "Educator balance should equal course price");
    }
    
    /// Test course completion and refund
    /// #sender: account-1
    function testCourseCompletion() public {
        // Initial educator balance
        uint256 initialEducatorBalance = platform.educatorBalance(acc1);
        
        // Complete the course as educator (acc1)
        platform.markCourseCompleted(acc2, courseId);
        
        // Check completion status
        (
            ,
            ,
            bool completed,
            bool refunded
        ) = platform.getEnrollmentDetails(acc2, courseId);
        
        // Verify completion and refund
        Assert.equal(completed, true, "Course should be marked as completed");
        Assert.equal(refunded, true, "Refund should be processed");
        
        // Calculate expected refund
        uint256 refundAmount = (price * refundPercent) / 100;
        
        // Check educator balance after refund
        uint256 newEducatorBalance = platform.educatorBalance(acc1);
        Assert.equal(newEducatorBalance, initialEducatorBalance - refundAmount, "Educator balance should decrease by refund amount");
    }
    
    // Helper functions for verifying course details
    function verifyCourseEducator(uint256 _courseId, address expected) internal {
        (address actual, , , , , , , ) = platform.courses(_courseId);
        Assert.equal(actual, expected, "Educator address mismatch");
    }
    
    function verifyCourseTitle(uint256 _courseId, string memory expected) internal {
        (, string memory actual, , , , , , ) = platform.courses(_courseId);
        Assert.equal(actual, expected, "Title mismatch");
    }
    
    function verifyCourseDesc(uint256 _courseId, string memory expected) internal {
        (, , string memory actual, , , , , ) = platform.courses(_courseId);
        Assert.equal(actual, expected, "Description mismatch");
    }
    
    function verifyCourseHash(uint256 _courseId, string memory expected) internal {
        (, , , string memory actual, , , , ) = platform.courses(_courseId);
        Assert.equal(actual, expected, "IPFS hash mismatch");
    }
    
    function verifyCoursePrice(uint256 _courseId, uint256 expected) internal {
        (, , , , uint256 actual, , , ) = platform.courses(_courseId);
        Assert.equal(actual, expected, "Price mismatch");
    }
    
    function verifyCourseTimeLimit(uint256 _courseId, uint256 expected) internal {
        (, , , , , uint256 actual, , ) = platform.courses(_courseId);
        Assert.equal(actual, expected, "Time limit mismatch");
    }
    
    function verifyCourseRefundPercent(uint256 _courseId, uint8 expected) internal {
        (, , , , , , uint8 actual, ) = platform.courses(_courseId);
        Assert.equal(uint256(actual), uint256(expected), "Refund percentage mismatch");
    }
    
    function verifyCourseActive(uint256 _courseId, bool expected) internal {
        (, , , , , , , bool actual) = platform.courses(_courseId);
        Assert.equal(actual, expected, "Active status mismatch");
    }
    
    /// Test course update functionality - refactored to avoid stack too deep
    /// #sender: account-1
    function testCourseUpdate() public {
        string memory newTitle = "Advanced Blockchain";
        string memory newDesc = "Advanced topics in blockchain technology";
        string memory newHash = "QmNewHash123";
        uint256 newPrice = 0.1 ether;
        uint256 newTimeLimit = 30 days;
        uint8 newRefundPercent = 30;
        
        // Update the course as educator (acc1)
        platform.updateCourse(
            courseId,
            newTitle,
            newDesc,
            newHash,
            newPrice,
            newTimeLimit,
            newRefundPercent,
            true
        );
        
        // Verify each field separately
        verifyCourseTitle(courseId, newTitle);
        verifyCourseDesc(courseId, newDesc);
        verifyCourseHash(courseId, newHash);
        verifyCoursePrice(courseId, newPrice);
        verifyCourseTimeLimit(courseId, newTimeLimit);
        verifyCourseRefundPercent(courseId, newRefundPercent);
        verifyCourseActive(courseId, true);
    }
    
    /// Test course deactivation - refactored to avoid stack too deep
    /// #sender: account-1
    function testCourseDeactivation() public {
        // First verify course is active
        verifyCourseActive(courseId, true);
        
        // Deactivate course
        platform.updateCourse(
            courseId,
            "Advanced Blockchain", // from previous test
            "Advanced topics in blockchain technology", // from previous test
            "QmNewHash123", // from previous test
            0.1 ether, // from previous test
            30 days, // from previous test
            30, // from previous test
            false // Set isActive to false
        );
        
        // Verify course is deactivated
        verifyCourseActive(courseId, false);
    }
    
    /// Test educator balance withdrawal
    /// #sender: account-1
    function testEducatorWithdrawal() public {
        // Check non-zero educator balance
        uint256 initialBalance = platform.educatorBalance(acc1);
        Assert.notEqual(initialBalance, 0, "Educator should have some balance");
        
        // Withdraw balance as educator (acc1)
        platform.withdrawBalance();
        
        // Check educator balance after withdrawal
        uint256 newBalance = platform.educatorBalance(acc1);
        Assert.equal(newBalance, 0, "Educator balance should be zero after withdrawal");
    }
    
    // Additional test to create a second course for further testing
    /// #sender: account-1
    function testCreateSecondCourse() public {
        platform.createCourse(
            "Solidity Deep Dive",
            "Advanced Solidity programming techniques",
            "QmSecondCourse123",
            0.08 ether,
            21 days,
            35
        );
        
        // Check that the educator now has two courses
        uint256[] memory educatorCourses = platform.getEducatorCourses(acc1);
        Assert.equal(educatorCourses.length, 2, "Educator should have 2 courses now");
    }
}