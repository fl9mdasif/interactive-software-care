import toast from "react-hot-toast";
import { errorMessage } from "./ui";

/** Run a mutation, report the outcome, and say whether it worked. */
export async function run<T>(request: { unwrap: () => Promise<T> }, success: string): Promise<T | null> {
  try {
    const result = await request.unwrap();
    toast.success(success);
    return result ?? (true as T);
  } catch (error) {
    toast.error(errorMessage(error));
    return null;
  }
}
