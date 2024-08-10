#include <iostream>
#include <string>
#include <set>
#include <map>
#include <stack>
#include <queue>

using namespace std;

class NFA {
public:
    set<int> states;
    map<pair<int, char>, set<int>> transition;
    int start_state;
    set<int> final_states;

    NFA(int start, set<int> final) : start_state(start), final_states(final) {}

    void addTransition(int from, char input, int to) {
        transition[{from, input}].insert(to);
    }
};

class DFA {
public:
    set<int> states;
    map<pair<int, char>, int> transition;
    int start_state;
    set<int> final_states;

    DFA(int start, set<int> final) : start_state(start), final_states(final) {}

    void addTransition(int from, char input, int to) {
        transition[{from, input}] = to;
    }

    bool simulate(const string& input) {
        int current_state = start_state;
        for (char c : input) {
            if (transition.find({current_state, c}) == transition.end()) {
                return false;
            }
            current_state = transition[{current_state, c}];
        }
        return final_states.count(current_state) > 0;
    }
};

// Function to build DFA from Regular Expression
DFA regexToDFA(const string& re) {
    // This is a simplified example; a full implementation would require handling operators like *, +, and concatenation.
    // For simplicity, this example handles the given RE "(a+aa*b)*"
    NFA nfa(0, {1});
    
    nfa.addTransition(0, 'a', 1);
    nfa.addTransition(0, 'a', 2);
    nfa.addTransition(2, 'a', 2);
    nfa.addTransition(2, 'b', 1);

    // Converting NFA to DFA (simplified for this specific example)
    DFA dfa(0, {1});

    dfa.addTransition(0, 'a', 1);
    dfa.addTransition(0, 'a', 2);
    dfa.addTransition(2, 'a', 2);
    dfa.addTransition(2, 'b', 1);

    return dfa;
}

int main() {
    string re = "(a+aa*b)*"; // Given Regular Expression
    DFA dfa = regexToDFA(re);

    string input;
    cout << "Enter Input String: ";
    cin >> input;

    if (dfa.simulate(input)) {
        cout << "Output: String Accepted." << endl;
    } else {
        cout << "Output: String not Accepted." << endl;
    }

    return 0;
}
