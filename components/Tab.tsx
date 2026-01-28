type TabProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

const Tab = ({ label, active, onClick }: TabProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1.5  rounded-lg  transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 min-w-[100px] text-center ${
        active
          ? "bg-[#FA9529] text-white"
          : "bg-[#FFFFFF] text-[#9C9C9C] hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
};

export default Tab;