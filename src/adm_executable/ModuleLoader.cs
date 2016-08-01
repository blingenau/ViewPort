using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Reflection;
using System.IO;
using Newtonsoft.Json;

namespace ModuleLoader
{
    class ModuleLoader
    {
        // A global variable that references the loaded dll module.
        static dynamic moduleInstance;

        /// <summary>
        /// Loads the specified dll module (in its current state it is built
        /// around the DYMO Label Printer).
        /// </summary>
        /// <param name="moduleName">The full path to the dll.</param>
        static void LoadModule(string moduleName)
        {
            try
            {
                System.Reflection.Assembly dll = System.Reflection.Assembly.LoadFile(moduleName);
                if (dll != null)
                {
                    Type type = dll.GetType("Apollo.Main");
                    if (type != null)
                    {
                        moduleInstance = Activator.CreateInstance(type);
                        moduleInstance.Instantiate();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex.Message);
                Console.Error.Flush();
            }
        }

        /// <summary>
        /// Wrapper around the dll's Print method. Builds and prints a DYMO label.
        /// </summary>
        /// <param name="labelURL">String, the URL to get the label template from.</param>
        /// <param name="JSONObjectText">String, a JSON encoded object with label items as keys, and values
        /// of those items as the values.</param>
        /// <param name="useDefaultPrinter">Boolean, whether to use the first printer found, or get all
        /// available printers and let the user pick one.</param>
        /// <returns>A string with an error message to display to the user if there was an error, or a JSON
        /// encoded array of printer names if the user needs to pick a printer, or an empty string if
        /// printing was successful.</returns>
        static string CallPrint(string labelURL, string JSONObjectText, bool useDefaultPrinter)
        {
            return moduleInstance.Print(labelURL, JSONObjectText, useDefaultPrinter);
        }

        /// <summary>
        /// Wrapper around the dll's IsSoftwareInstalled method. Checks whether the DYMO software 
        /// is installed based on whether we can talk to the DYMO dll.
        /// </summary>
        /// <returns>Whether or not the DYMO software is installed.</returns>
        static string CallIsSoftwareInstalled()
        {
            return Convert.ToString(moduleInstance.IsSoftwareInstalled());
        }

        /// <summary>
        /// Wrapper around the dll's GetDeviceStatus method. Uses DYMO's framework to query the
        /// computer for connected devices.
        /// </summary>
        /// <returns>String, "1" if 1 or more printers are found, "0" otherwise.</returns>
        static string CallGetDeviceStatus()
        {
            return moduleInstance.GetDeviceStatus();
        }

        static void Main(string[] args)
        {
            // Todo: Make this able to load any given dll.
            LoadModule(Directory.GetCurrentDirectory() + @"\src\bin\dymo\DYMOLabelPrinter.dll");

            /// This exe talks with ViewPort through stdin/out communication. We've set up a simple
            /// do while loop that waits for the main node process to write to this process's stdin.
            /// This message is sent as a stringified JSON object in the following format:
            /// {id: [some identifier string], message: [string of commands/data]}
            /// The id is used mostly by the node process for event handling. The message is what the
            /// node process received via web sockets from athenanet. This process then handles the 
            /// command given with a switch case.
            string line = null;
            do
            {
                line = Console.ReadLine();
                try
                {
                    var input = JsonConvert.DeserializeObject<Dictionary<string, string>>(line);
                    string id = input["id"];
                    var command = JsonConvert.DeserializeObject<Dictionary<string, string>>(input["message"]);
                    Dictionary<string, string> response = new Dictionary<string, string>();
                    string dllResponse;
                    response.Add("id", id);
                    switch (command["Action"])
                    {
                        case "Print":
                            var data = JsonConvert.DeserializeObject<Dictionary<string, string>>(command["Data"]);
                            dllResponse = CallPrint(data["labelURL"], data["JSONObjectText"], Convert.ToBoolean(data["useDefaultPrinter"]));
                            if (dllResponse == "")
                            {
                                dllResponse = "null";
                            }
                            response.Add("response", dllResponse);
                            Console.WriteLine(JsonConvert.SerializeObject(response));
                            Console.Out.Flush();
                            line = null;
                            break;
                        case "IsSoftwareInstalled":
                            dllResponse = CallIsSoftwareInstalled();
                            response.Add("response", dllResponse);
                            Console.WriteLine(JsonConvert.SerializeObject(response));
                            Console.Out.Flush();
                            line = null;
                            break;
                        case "Status":
                            dllResponse = CallGetDeviceStatus();
                            response.Add("response", dllResponse);
                            Console.WriteLine(JsonConvert.SerializeObject(response));
                            Console.Out.Flush();
                            line = null;
                            break;
                        default:
                            Console.WriteLine("Action not found");
                            Console.Out.Flush();
                            break;
                    }
                }
                catch (Exception e)
                {
                    Console.Error.WriteLine(e.Message + " - " + line);
                    Console.Error.Flush();
                }
            } while (line == null);
        }
    }
}
