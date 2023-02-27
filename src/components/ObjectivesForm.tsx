import styles from "@/styles/Home.module.css";
import { useState } from "react";
import { mockUsers } from "@/pages/mock-data/mock-users";
import React from "react";

export const ObjectivesForm = ({ users, setUsers }) => {
  const [suggestions, setSuggestions] = useState<Record<number, string>>({});
  const handleChange = (event, index, type) => {
    const updatedUsers = [...users];
    if (type === "id") {
      updatedUsers[index].id = event.target.value;
    } else if (type === "objective") {
      updatedUsers[index].objectives[event.target.name] = event.target.value;
    } else {
      setSuggestions({ ...suggestions, [index]: event.target.value });
    }
    setUsers(updatedUsers);
  };

  const handleAddUser = () => {
    if (!users.some((x) => x.id === "")) {
      setUsers([...users, { id: "", objectives: [""] }]);
    }
  };
  const handleRemoveUserObjective = (userIdx, objIdx) => {
    const updatedUsers = [...users];
    delete updatedUsers[userIdx].objectives[objIdx];
    setUsers(updatedUsers);
  };
  const handleAddUserObjective = (userIdx) => {
    const updatedUsers = [...users];
    if (!updatedUsers[userIdx].objectives.some((x) => x === "")) {
      updatedUsers[userIdx].objectives.push("");
    }
    setUsers(updatedUsers);
  };
  const generateUserObjective = async (userIdx) => {
    const results = await fetch("/api/generate-objective", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ suggestion: suggestions[userIdx] }),
    });
    const resultsJson = await results.json();
    const updatedUsers = [...users];
    if (!updatedUsers[userIdx].objectives.some((x) => x === "")) {
      updatedUsers[userIdx].objectives.push(resultsJson.objective);
    }
    setUsers(updatedUsers);
  };
  return (
    <div className={styles.form}>
      {users.map((user, userIndex) => {
        const userHasEmptyObjective = user.objectives.some((x) => x === "");
        return (
          <div key={userIndex} className={styles.user}>
            <>
              <div>Name</div>
              <input
                className={styles.input}
                type="text"
                placeholder="User id"
                value={user.id}
                onChange={(event) => handleChange(event, userIndex, "id")}
              />
              {userIndex != 0 ? (
                <button
                  className={styles.Button}
                  onClick={() =>
                    setUsers([
                      ...users.slice(0, userIndex),
                      ...users.slice(userIndex + 1),
                    ])
                  }
                >
                  X
                </button>
              ) : null}
            </>
            <div>Objectives</div>
            {user.objectives.map((objective, objectiveIndex) => (
              <React.Fragment key={`${userIndex}-${objectiveIndex}`}>
                <input
                  className={styles.input}
                  key={objectiveIndex}
                  type="text"
                  placeholder={`Objective ${objectiveIndex + 1}`}
                  name={objectiveIndex}
                  value={objective}
                  onChange={(event) =>
                    handleChange(event, userIndex, "objective")
                  }
                />
                {objectiveIndex != 0 ? (
                  <button
                    className={styles.Button}
                    onClick={() =>
                      handleRemoveUserObjective(userIndex, objectiveIndex)
                    }
                  >
                    X
                  </button>
                ) : null}
              </React.Fragment>
            ))}
            {!userHasEmptyObjective && (
              <>
                <button
                  className={styles.Button}
                  onClick={() => handleAddUserObjective(userIndex)}
                >
                  Add Objective
                </button>
                <div>----------------OR------------------</div>
                <input
                  className={styles.input}
                  key={`${userIndex}-suggestion`}
                  type="text"
                  placeholder={`Keyword Suggestion`}
                  name={`${userIndex}-suggestion`}
                  value={suggestions[userIndex]}
                  onChange={(event) =>
                    handleChange(event, userIndex, "suggestion")
                  }
                />
                <button
                  className={styles.Button}
                  onClick={async () =>
                    suggestions[userIndex] &&
                    (await generateUserObjective(userIndex))
                  }
                >
                  <svg
                    fill="#fff"
                    height="12px"
                    width="12px"
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 489.059 489.059"
                    xmlSpace="preserve"
                  >
                    <path
                      d="M481.211,443.368L224.809,186.946l55.817-17.364c3.88-1.196,6.736-4.509,7.38-8.528c0.642-4.018-1.058-8.051-4.383-10.385
	l-56.798-40.165c-9.814-6.913-15.56-18.2-15.417-30.172l0.916-69.519c0.051-4.06-2.23-7.796-5.837-9.647
	c-3.608-1.844-7.976-1.483-11.225,0.962l-55.73,41.584c-9.588,7.163-22.117,9.136-33.439,5.294L40.246,26.678
	c-3.848-1.315-8.118-0.322-11.007,2.55c-2.868,2.872-3.847,7.138-2.563,10.987l22.376,65.862c3.8,11.343,1.828,23.837-5.325,33.438
	L2.131,195.245c-2.418,3.272-2.819,7.628-0.977,11.236c1.859,3.633,5.599,5.887,9.688,5.84l69.502-0.898
	c11.971-0.153,23.244,5.582,30.174,15.366l40.149,56.807c2.373,3.32,6.401,5.021,10.412,4.387c4.025-0.632,7.314-3.497,8.518-7.378
	l17.375-55.805l256.389,256.422c5.243,5.221,12.094,7.836,18.908,7.836c6.885,0,13.73-2.615,18.943-7.836
	C491.671,470.772,491.671,453.826,481.211,443.368z"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        );
      })}
      <button className={styles.Button} onClick={handleAddUser}>
        Add user
      </button>
    </div>
  );
};
