import app, { initializeApp } from "../app";
import { prisma } from "../database/prisma";
import http from "http";

const TEST_PORT = 8999;
const USER_A_ID = "11111111-1111-1111-1111-111111111111";
const USER_B_ID = "22222222-2222-2222-2222-222222222222";

async function request(
  method: string,
  path: string,
  userId: string,
  body?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : "";
    const options: http.RequestOptions = {
      hostname: "localhost",
      port: TEST_PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
        "Content-Length": Buffer.byteLength(dataString),
      },
    };

    const req = http.request(options, (res) => {
      let resData = "";
      res.on("data", (chunk) => (resData += chunk));
      res.on("end", () => {
        try {
          const parsed = resData ? JSON.parse(resData) : {};
          resolve({ status: res.statusCode || 500, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode || 500, body: resData });
        }
      });
    });

    req.on("error", reject);
    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runIntegrationTests() {
  console.log("\n🚀 Starting Kaizu Backend Integration Tests...\n");

  await initializeApp();
  const server = app.listen(TEST_PORT);

  try {
    // 1. Health check test
    console.log("--- 1. Health Check Test ---");
    const healthRes = await request("GET", "/health", USER_A_ID);
    assert(healthRes.status === 200, "Health check status 200");
    assert(healthRes.body.status === "ok", "Health status is ok");

    // 2. Auth / User profile test
    console.log("\n--- 2. User Profile / Auth Test ---");
    const meRes = await request("GET", "/api/auth/me", USER_A_ID);
    assert(meRes.status === 200, "Get me profile returns 200");
    assert(meRes.body.data.id === USER_A_ID, "Returned user ID matches header");

    // 3. Subject CRUD & Validation
    console.log("\n--- 3. Subject CRUD & Validation ---");
    // Missing name validation test
    const invalidSubRes = await request("POST", "/api/subjects", USER_A_ID, { name: "" });
    assert(invalidSubRes.status === 400, "Creating subject with empty name fails with 400");

    // Valid Subject creation
    const createSubRes = await request("POST", "/api/subjects", USER_A_ID, {
      name: "Operating Systems",
      description: "Learning OS fundamentals from OSTEP",
    });
    assert(createSubRes.status === 200, "Create Subject succeeded");
    const subjectA = createSubRes.body.data;
    assert(subjectA.name === "Operating Systems", "Subject name matches");

    // List subjects for User A
    const listSubRes = await request("GET", "/api/subjects", USER_A_ID);
    assert(listSubRes.status === 200, "List subjects returns 200");
    assert(listSubRes.body.data.some((s: any) => s.id === subjectA.id), "Subject present in list");

    // Update Subject
    const updateSubRes = await request("PATCH", `/api/subjects/${subjectA.id}`, USER_A_ID, {
      description: "Updated description: OSTEP + practice",
    });
    assert(updateSubRes.status === 200, "Update Subject succeeded");
    assert(updateSubRes.body.data.description === "Updated description: OSTEP + practice", "Subject description updated");

    // 4. Chapter CRUD under Subject
    console.log("\n--- 4. Chapter CRUD ---");
    const createChapRes = await request("POST", `/api/chapters/subject/${subjectA.id}`, USER_A_ID, {
      title: "Memory Management",
      description: "Paging and Virtual Memory",
    });
    assert(createChapRes.status === 200, "Create Chapter succeeded");
    const chapterA = createChapRes.body.data;
    assert(chapterA.title === "Memory Management", "Chapter title matches");

    // 5. Topic CRUD under Chapter
    console.log("\n--- 5. Topic CRUD ---");
    const createTopicRes = await request("POST", `/api/topics/chapter/${chapterA.id}`, USER_A_ID, {
      title: "Page Replacement Algorithms",
    });
    assert(createTopicRes.status === 200, "Create Topic succeeded");
    const topicA = createTopicRes.body.data;
    assert(topicA.title === "Page Replacement Algorithms", "Topic title matches");

    // Fetch Subject detail with nested chapters & topics
    const fetchSubDetailRes = await request("GET", `/api/subjects/${subjectA.id}`, USER_A_ID);
    assert(fetchSubDetailRes.status === 200, "Fetch subject detail succeeded");
    assert(fetchSubDetailRes.body.data.chapterCount === 1, "Chapter count is 1");
    assert(fetchSubDetailRes.body.data.topicCount === 1, "Topic count is 1");
    assert(fetchSubDetailRes.body.data.chapters[0].topics[0].id === topicA.id, "Nested topic matches topicA");

    // 6. Cross-User Security & Isolation
    console.log("\n--- 6. Cross-User Isolation Security Test ---");
    // User B attempts to access User A's subject
    const userBSubFetch = await request("GET", `/api/subjects/${subjectA.id}`, USER_B_ID);
    assert(userBSubFetch.status === 404, "User B gets 404 trying to fetch User A's subject");

    // User B attempts to update User A's subject
    const userBSubUpdate = await request("PATCH", `/api/subjects/${subjectA.id}`, USER_B_ID, { name: "Hacked" });
    assert(userBSubUpdate.status === 404, "User B gets 404 trying to update User A's subject");

    // User B attempts to add a chapter to User A's subject
    const userBAddChap = await request("POST", `/api/chapters/subject/${subjectA.id}`, USER_B_ID, { title: "Malicious" });
    assert(userBAddChap.status === 404, "User B gets 404 trying to add chapter to User A's subject");

    // User B attempts to delete User A's topic
    const userBDeleteTopic = await request("DELETE", `/api/topics/${topicA.id}`, USER_B_ID);
    assert(userBDeleteTopic.status === 404, "User B gets 404 trying to delete User A's topic");

    // 7. Goal CRUD
    console.log("\n--- 7. Goal CRUD ---");
    const createGoalRes = await request("POST", "/api/goals", USER_A_ID, {
      title: "Learn Guitar",
      description: "Play 5 songs fluently",
    });
    assert(createGoalRes.status === 200, "Create Goal succeeded");
    const goalA = createGoalRes.body.data;
    assert(goalA.status === "ACTIVE", "Default Goal status is ACTIVE");

    // Complete Goal
    const completeGoalRes = await request("PATCH", `/api/goals/${goalA.id}`, USER_A_ID, {
      status: "COMPLETED",
    });
    assert(completeGoalRes.status === 200, "Complete Goal succeeded");
    assert(completeGoalRes.body.data.status === "COMPLETED", "Goal status updated to COMPLETED");
    assert(completeGoalRes.body.data.completedAt !== null, "completedAt timestamp is populated");

    // 8. Cascade Deletion Test
    console.log("\n--- 8. Cascade Deletion Test ---");
    const deleteSubRes = await request("DELETE", `/api/subjects/${subjectA.id}`, USER_A_ID);
    assert(deleteSubRes.status === 200, "Delete Subject succeeded");

    // Verify Chapter and Topic were cascaded
    const fetchChapAfterDel = await request("GET", `/api/chapters/${chapterA.id}`, USER_A_ID);
    assert(fetchChapAfterDel.status === 404, "Chapter was deleted by cascade");

    console.log("\n✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY!\n");
  } catch (err) {
    console.error("\n❌ Test Execution Error:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runIntegrationTests();
