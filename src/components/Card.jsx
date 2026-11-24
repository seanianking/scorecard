import React from "react";

const Card = ({ icon, header, body, buttonText, buttonClickAction }) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row mb-5 items-center">
        <div className="mr-5">{icon}</div>
        <h4>{header}</h4>
      </div>
      <div>
        <p>{body}</p>
      </div>
      <div className="mt-5">
        <button className="" onClick={buttonClickAction}>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default Card;
