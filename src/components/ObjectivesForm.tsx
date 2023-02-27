import styles from "@/styles/Home.module.css";
import { useState } from "react";
import { mockUsers } from "@/pages/mock-data/mock-users";

export const ObjectivesForm = ({ users, setUsers }) => {
  const handleChange = (event, index, type) => {
    const updatedUsers = [...users];
    if (type === "id") {
      updatedUsers[index].id = event.target.value;
    } else {
      updatedUsers[index].objectives[event.target.name] = event.target.value;
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
  return (
    <div className={styles.form}>
      {users.map((user, userIndex) => (
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
            <>
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
            </>
          ))}
          <button
            className={styles.Button}
            onClick={() => handleAddUserObjective(userIndex)}
          >
            Add Objective
          </button>
        </div>
      ))}
      <button className={styles.Button} onClick={handleAddUser}>
        Add user
      </button>
    </div>
  );
};
